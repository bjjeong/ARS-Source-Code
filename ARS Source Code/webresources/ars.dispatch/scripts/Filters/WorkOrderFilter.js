/*global $, ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Filters = ARS.Filters || {};
ARS.Filters.WorkOrderFilter = (function () {
    "use strict";

    function mapSelectionToCodes(selection, codes) {
        var keys;

        switch (selection) {
        case "Unassigned":
            keys = [ "Accepted", "Scheduled" ];
            break;

        case "Return":
        case "Recall":
            keys = [ selection ];
            break;

        case "All":
            keys = [
                "Accepted", "In Progress", "Recall", "Return", "Scheduled",
                "Technician Offsite"
            ];
            break;

        default:
            throw new Error("Unrecognized selection: " + selection);
        }

        return codes.filter(function (code) {
            return keys.indexOf(code.label) !== -1;
        }).pluck("value");
    }

    function Behavior(instance) {
        this.attach = function () {
            var ev, sel, fn;
            ev  = "click";
            sel = "li";
            fn  = this.onClick_Item;
            instance.$element.on(ev, sel, fn);
        };

        this.onClick_Item = function (e) {
            var bubbled;

            instance.self.setSelectedByElement(e.target);

            bubbled = new $.Event(e, { type: "changeWorkOrderFilter" });
            $(instance.self).triggerHandler(bubbled);
        };
    }

    function WorkOrderFilter(element, incidentCodes) {
        if (!element) {
            throw new Error("Missing parameter: element");
        }

        if (!incidentCodes) {
            throw new Error("Missing parameter: incidentCodes");
        }

        var instance            = {};
        instance.$element       = $(element);
        instance.behavior       = new Behavior(instance);
        instance.incidentCodes  = incidentCodes;
        instance.self           = this;

        Object.defineProperties(this, {
            includeCompletedSchedules: {
                get: function () {
                    return this.selected !== "Unassigned";
                }
            },
            selected: {
                get: function () {
                    var selected = instance.$element
                        .find(".active")
                        .first()
                        .attr("id");

                    return selected || "All";
                }
            },
            selectedCodes: {
                get: function () {
                    var codes, selection;
                    codes     = instance.incidentCodes;
                    selection = this.selected;
                    return mapSelectionToCodes(selection, codes);
                }
            }
        });

        this.setSelectedByElement = function (el) {
            var $item;
            $item = $(el).closest("li");

            if ($item.parent().is(instance.$element)) {
                instance.$element.find("li.active").removeClass("active");
                $item.addClass("active");
                $(".order-title").text($item.text());
            }
        };

        instance.behavior.attach();
    }

    WorkOrderFilter.prototype =
        Object.create(ARS.Filters.FilterBase.prototype);

    WorkOrderFilter.prototype.constructor = WorkOrderFilter;

    WorkOrderFilter.prototype.applyToWorkOrderQuery = function (query) {
        query.includeCompletedSchedules = this.includeCompletedSchedules;
        query.clearStatusCodes();
        this.selectedCodes.forEach(query.addStatusCode, query);
    };

    return WorkOrderFilter;
}());
