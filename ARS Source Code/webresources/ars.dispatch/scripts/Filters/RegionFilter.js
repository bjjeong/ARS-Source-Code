/*global $, ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Filters = ARS.Filters || {};
ARS.Filters.RegionFilter = (function () {
    "use strict";

    function bubbleEvent(instance) {
        return function (e) {
            var bubbled, eventArgs;
            bubbled = new $.Event(e, { type: "changeRegion" });
            eventArgs = {};
            eventArgs.selected = instance.getSelected();
            $(instance).triggerHandler(bubbled, eventArgs);
        };
    }

    function formatSelection(selection) {
        return selection.checkedItems.map(function (checkbox) {
            return $(checkbox).attr("title");
        }).join();
    }

    function selectedText(numChecked, numTotal, checkedItems) {
        var selection;
        selection              = {};
        selection.numChecked   = numChecked;
        selection.numTotal     = numTotal;
        selection.checkedItems = checkedItems;

        return formatSelection(selection);
    }

    function RegionFilter(container, attribute, templateService) {
        if (!container) {
            throw new Error("Missing parameter: container");
        }

        if (!attribute) {
            throw new Error("Missing parameter: attribute");
        }

        if (!templateService) {
            throw new Error("Missing parameter: templateService");
        }

        container = $(container);

        this.clearRegions = function () {
            container.empty().multiselect("refresh");
        };

        this.addRegions = function (regions) {
            var template = templateService.getTemplate("regionTemplate");

            regions.forEach(function (region) {
                template(region).appendTo(container);
            });

            container.multiselect("refresh");
        };

        this.getAttribute = function () {
            return attribute;
        };

        this.getSelected = function () {
            return container
                .multiselect("getChecked")
                .toArray()
                .pluck("value");
        };

        this.selectFirst = function () {
            container.find("option").prop("selected", false);
            container.find("option").first().prop("selected", true);
            container.multiselect("refresh");
        };

        this.applyToWorkOrderQuery = function (query) {
            query.clearRegions();

            container
                .multiselect("getChecked")
                .toArray()
                .forEach(function (input) {
                    var name, id;
                    name = input.title;
                    id   = input.value;
                    query.addRegion(id, name);
                });
        };

        this.applyToTechnicianQuery = this.applyToWorkOrderQuery;

        container.multiselect({
            selectedText: selectedText,
            click:        bubbleEvent(this),
            checkAll:     bubbleEvent(this),
            uncheckAll:   bubbleEvent(this)
        });
    }

    RegionFilter.prototype = Object.create(ARS.Filters.FilterBase.prototype);
    RegionFilter.prototype.constructor = RegionFilter;

    return RegionFilter;
}());
