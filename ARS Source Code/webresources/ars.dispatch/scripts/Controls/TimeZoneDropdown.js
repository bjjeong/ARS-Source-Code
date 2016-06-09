/*global $, document, window */

var ARS;
ARS = window.ARS || {};
ARS.Controls = ARS.Controls || {};
ARS.Controls.TimeZoneDropdown = (function () {
    "use strict";

    function Behavior(control) {
        this.onChange = function (ev) {
            var bubble = new $.Event(ev, { type: "change" });
            $(control).triggerHandler(bubble);
        };

        this.attach = function () {
            control.dom.element.on("change", this.onChange);
        };
    }

    function Dom() {
        Object.defineProperties(this, {
            element: {
                value: $("<select class=\"timeZoneSelect\" />")
            },
            supportedTimeZones: {
                value: $("<optgroup label=\"United States\" />")
            },
            techTimeZones: {
                value: $("<optgroup label=\"Technician Time Zone\" />")
            },
            userTimeZone: {
                value: $("<optgroup label=\"Dispatch Time Zone\" />")
            }
        });

        this.element.append(this.userTimeZone);
        this.element.append(this.techTimeZones);
        this.element.append(this.supportedTimeZones);
    }

    Object.defineProperties(Dom.prototype, {
        selected: {
            get: function () {
                var idx, opt;
                idx = this.element.prop("selectedIndex");
                opt = this.element.find("option")[idx];
                return opt ? String(opt.value || "").trim() : "";
            }
        }
    });

    Dom.prototype.renderTimeZone = function (timeZone) {
        var opt = document.createElement("option");
        opt.text = timeZone.userInterfaceName;
        opt.value = timeZone.standardName;
        return opt;
    };

    function TimeZoneDropdown() {
        var instance                 = {};
        instance.userTimeZone        = null;
        instance.supportedTimeZones  = [];
        instance.technicianTimeZones = [];

        Object.defineProperties(this, {
            behavior: { value: new Behavior(this) },
            dom:      { value: new Dom()          },
            supportedTimeZones: {
                get: function () {
                    return instance.supportedTimeZones.slice(0);
                }
            },
            technicianTimeZones: {
                get: function () {
                    return instance.technicianTimeZones.slice(0);
                }
            },
            userTimeZone: {
                get: function () {
                    return instance.userTimeZone;
                },
                set: function (value) {
                    value =
                        value instanceof ARS.Models.TimeZone ? value : null;

                    if (value === null) {
                        if (instance.userTimeZone !== null) {
                            this.dom.userTimeZone.empty();
                            instance.userTimeZone = null;
                        }
                    } else if (value.equals(instance.userTimeZone) === false) {
                        this.dom.userTimeZone
                            .empty()
                            .append(this.dom.renderTimeZone(value));

                        instance.userTimeZone = value;
                    }
                }
            }
        });

        this.addSupportedTimeZone = function (timeZone) {
            if (timeZone instanceof ARS.Models.TimeZone === false) {
                throw new TypeError("Expecting ARS.Models.TimeZone.");
            }

            if (instance.supportedTimeZones.first(timeZone.equals, timeZone)) {
                return;
            }

            instance.supportedTimeZones.push(timeZone);

            this.dom.supportedTimeZones
                .append(this.dom.renderTimeZone(timeZone));
        };

        this.behavior.attach();
    }

    Object.defineProperties(TimeZoneDropdown.prototype, {
        selectedTimeZone: {
            get: function () {
                var value = this.dom.selected;

                return this.timeZones.first(function (tz) {
                    return tz.standardName === value;
                }) || null;
            }
        },
        timeZones: {
            get: function () {
                return this.supportedTimeZones
                    .concat(this.technicianTimeZones)
                    .concat([ this.userTimeZone ])
                    .filter(Boolean)
                    .distinct(function (a, b) {
                        return a.equals(b);
                    });
            }
        }
    });

    TimeZoneDropdown.prototype.prependTo = function (target) {
        this.dom.element.prependTo(target);
    };

    TimeZoneDropdown.prototype.updateTechnicianTimeZones = function (techs) {
        var current, options, selected;

        current = this.dom.element.find("option:selected").text();
        this.dom.techTimeZones.empty();

        techs = techs || [];

        options = techs.filter(function (tech) {
            return tech && tech.timeZone && tech.timeZone.standardName;
        }).distinct(function (a, b) {
            return a.equals(b);
        }).sort(function (a, b) {
            var x, y;
            x = String(a.name || "").toLowerCase();
            y = String(b.name || "").toLowerCase();
            return x > y ? 1 : x < y ? -1 : 0;
        }).map(function (tech) {
            var isSelected, text, value, option;
            text         = tech.name + " - " + tech.timeZone.userInterfaceName;
            value        = tech.timeZone.standardName;
            isSelected   = text === current;
            option       = document.createElement("option");
            option.text  = text;
            option.value = value;
            return { option: option, selected: isSelected };
        });

        options.forEach(function (o) {
            this.dom.techTimeZones.append(o.option);
        }, this);

        selected = options.first(function (o) {
            return o.selected ? o.option : null;
        });

        if (selected) {
            selected = this.dom.element.find("option").index(selected);

            if (selected !== -1) {
                this.dom.element.prop("selectedIndex", selected);
            }
        }
    };

    return TimeZoneDropdown;
}());
