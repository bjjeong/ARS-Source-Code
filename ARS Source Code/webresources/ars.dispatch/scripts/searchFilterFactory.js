/*global $, ARS */

var ARS;
ARS = ARS || {};
ARS.SearchFilterFactory = (function () {
    "use strict";

    function Behavior(instance) {
        function bubble(ev) {
            var bubbled = new $.Event(ev);
            $(instance.self).triggerHandler(bubbled);
        }

        this.attach = function () {
            $(instance.allUsersFilter).on("changeAllUsers", bubble);
            $(instance.regionFilter).on("changeRegion", bubble);
            $(instance.techFilter).on("changeTechnician", bubble);
            $(instance.ticketFilter).on("changeTicket", bubble);
            $(instance.workOrderFilter).on("changeWorkOrderFilter", bubble);
        };
    }

    function createAllUsersFilter() {
        var container = $("#allUsers");
        return new ARS.Filters.AllUsersFilter(container);
    }

    function createRegionFilter(templateService) {
        var container, attribute;
        container = $("#regions");
        attribute = "ars_Region/Id";
        return new ARS.Filters
            .RegionFilter(container, attribute, templateService);
    }

    function createTechFilter(templateService) {
        var template = templateService.getTemplate("technicianTemplate");
        return new ARS.Filters.TechnicianFilter("#technicians", template);
    }

    function createTicketFilter() {
        var attribute, container;
        attribute = "TicketNumber";
        container = $("#search");
        return new ARS.Filters.TicketFilter(attribute, container);
    }

    function createWorkOrderFilter(incidentCodes) {
        var container = $(".order-filter");
        return new ARS.Filters.WorkOrderFilter(container, incidentCodes);
    }

    function SearchFilterFactory(templateService, incidentCodes) {
        if (!templateService) {
            throw new Error("'templateService' is required");
        }

        if (!incidentCodes) {
            throw new Error("'incidentCodes' is required");
        }

        var instance;
        instance = {};
        instance.allUsersFilter  = createAllUsersFilter();
        instance.behavior        = new Behavior(instance);
        instance.regionFilter    = createRegionFilter(templateService);
        instance.techFilter      = createTechFilter(templateService);
        instance.ticketFilter    = createTicketFilter();
        instance.workOrderFilter = createWorkOrderFilter(incidentCodes);
        instance.self            = this;

        this.getAllUsersFilter = function () {
            return instance.allUsersFilter;
        };

        this.getRegionFilter = function () {
            return instance.regionFilter;
        };

        this.getTechnicianFilter = function () {
            return instance.techFilter;
        };

        this.getTicketFilter = function () {
            return instance.ticketFilter;
        };

        this.getWorkOrderFilter = function () {
            return instance.workOrderFilter;
        };

        instance.behavior.attach();
    }

    Object.defineProperties(SearchFilterFactory.prototype, {
        selectedTechnicians: {
            get: function () {
                return this.getTechnicianFilter().selectedTechnicians;
            }
        }
    });

    SearchFilterFactory.prototype.clearRegions = function () {
        this.getRegionFilter().clearRegions();
    };

    SearchFilterFactory.prototype.addRegions = function (regions) {
        this.getRegionFilter().addRegions(regions);
    };

    SearchFilterFactory.prototype.selectFirstRegion = function () {
        this.getRegionFilter().selectFirst();
    };

    SearchFilterFactory.prototype.clearTechnicians = function () {
        this.getTechnicianFilter().clearTechnicians();
    };

    SearchFilterFactory.prototype.addTechnicians = function (technicians) {
        this.getTechnicianFilter().addTechnicians(technicians);
    };

    SearchFilterFactory.prototype.selectFirstTechnician = function () {
        this.getTechnicianFilter().selectFirst();
    };

    SearchFilterFactory.prototype.selectTechnicianById =
        function (technicianId) {
            return this.getTechnicianFilter()
                .selectTechnicianById(technicianId);
        };

    return SearchFilterFactory;
}());
