/*global $, ARS, Promise, Tesseract */

var ARS;
ARS = ARS || {};
ARS.Filters = ARS.Filters || {};
ARS.Filters.TechnicianFilter = (function () {
    "use strict";

    function Behavior(filter) {
        this.attach = function () {
            var ev, fn;
            ev = Tesseract.Util.Selection.Event.afterChangeSelection;
            fn = this.onAfterChangeSelection;
            $(filter.selection).on(ev, fn);
        };

        this.onAfterChangeSelection = function (ev, args) {
            var bubble, data, props;
            props = {};
            props.type = "changeTechnician";
            bubble = new $.Event(ev, props);
            data = [];
            data[0] = args.newSelection;
            $(filter).triggerHandler(bubble, data);
        };
    }

    function Dom(container) {
        Object.defineProperties(this, {
            element: { value: $(container) }
        });
    }

    Object.defineProperties(Dom.prototype, {
        active: {
            get: function () {
                return this.technicians.filter(".active");
            }
        },
        technicians: {
            get: function () {
                return this.element.children();
            }
        },
        sortByTechnician: {
            get: function () {
                return $("[data-action='sort-by-technician']");
            }
        }
    });

    Dom.prototype.getByTechnicianId = function (technicianId) {
        var sel = "[data-technician-id='" + technicianId + "']";
        return this.technicians.filter(sel).first();
    };

    function Selection(filter) {
        function prev(item) {
            var techs = filter.technicians;
            return techs[techs.indexOf(item) - 1];
        }

        function next(item) {
            var techs = filter.technicians;
            return techs[techs.indexOf(item) + 1];
        }

        Tesseract.Util.Selection.Selection.call(this, {
            parentElement: filter.dom.element[0],
            elementSelector: "li",
            firstItem: function () {
                return filter.technicians[0];
            },
            getElementByItem: function (item) {
                return filter.dom.getByTechnicianId(item.technicianId)[0];
            },
            getItemByElement: function (element) {
                var tech;
                tech = $(element).data("technician-id");
                tech = filter.technicians.first(function (t) {
                    return t.technicianId === tech;
                });

                return tech;
            },
            getItemAbove: prev,
            getItemBelow: next,
            getItemLeft: prev,
            getItemRight: next,
            between: function (tech1, tech2) {
                var cursor, indicies, result, techs;
                techs = filter.technicians;
                indicies = [ tech1, tech2 ].map(function (tech) {
                    return techs.indexOf(tech);
                }).sort();
                result = [];
                cursor = indicies[0];
                while (cursor <= indicies[1]) {
                    result.push(techs[cursor]);
                    cursor += 1;
                }

                return result;
            }
        });
    }

    Selection.prototype =
        Object.create(Tesseract.Util.Selection.Selection.prototype);

    function TechnicianFilter(container, template) {
        if (!container) {
            throw new Error("Missing parameter: container");
        }

        if (!template) {
            throw new Error("Missing parameter: template");
        }

        var instance         = {};
        instance.technicians = [];

        Object.defineProperty(this, "dom", { value: new Dom(container) });

        Object.defineProperties(this, {
            behavior:  { value: new Behavior(this)  },
            selection: { value: new Selection(this) },
            selectedTechnicians: {
                get: function () {
                    return this.selection.selected;
                }
            },
            technicians: {
                get: function () {
                    return instance.technicians.slice(0);
                }
            }
        });

        this.clearTechnicians = function () {
            this.clearSelection();
            this.dom.element.empty();
            instance.technicians.length = [];
        };

        this.addTechnician = function (technician) {
            var exists = instance.technicians.first(function (t) {
                t.equals(technician);
            });

            if (exists) {
                return;
            }

            technician.toHtml(template).appendTo(this.dom.element);
            instance.technicians.push(technician);
        };

        this.behavior.attach();
        this.selection.attach();
    }

    TechnicianFilter.prototype =
        Object.create(ARS.Filters.FilterBase.prototype);

    TechnicianFilter.prototype.constructor = TechnicianFilter;

    TechnicianFilter.prototype.addTechnicians = function (technicians) {
        technicians.forEach(this.addTechnician, this);
    };

    TechnicianFilter.prototype.clearSelection = function () {
        this.selection.trySetSelection(this.technicians, []);
        this.updateSortability();
    };

    TechnicianFilter.prototype.selectByElement = function (el) {
        var $el = $(el);

        if ($el.parent().is(this.dom.element)) {
            $el.addClass("active");
            this.updateSortability();
        }
    };

    TechnicianFilter.prototype.selectFirst = function () {
        var unselect, select;
        select = this.technicians.slice(0, 1);
        unselect = this.technicians.except(select);
        this.selection.trySetSelection(unselect, select);
        this.updateSortability();
    };

    TechnicianFilter.prototype.updateSortability = function () {
        var canSort = this.selectedTechnicians.length === 1;
        this.dom.sortByTechnician.prop("disabled", !canSort);
    };

    TechnicianFilter.prototype.selectTechnicianById = function (technicianId) {
        var unselect, select;

        select = this.technicians.filter(function (t) {
            return t.technicianId === technicianId;
        });

        unselect = this.technicians.except(select);

        this.selection.trySetSelection(unselect, select);
        this.updateSortability();
    };

    TechnicianFilter.prototype.applyToServiceAppointmentQuery =
        function (query) {
            query.clearTechnicians();
            this.selectedTechnicians.forEach(query.addTechnician, query);
        };

    return TechnicianFilter;
}());
