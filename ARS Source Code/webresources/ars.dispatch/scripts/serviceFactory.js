/*global ARS, document, window */

var ARS;
ARS = ARS || {};
ARS.ServiceFactory = (function () {
    "use strict";

    var services;
    services                           = {};
    services.dataRepository            = null;
    services.fetchXmlService           = null;
    services.regionService             = null;
    services.serviceAppointmentService = null;
    services.settingsService           = null;
    services.technicianService         = null;
    services.timeService               = null;
    services.workOrderService          = null;

    function useFakes() {
        if (document.location.protocol === "file:") {
            return true;
        }

        return window.Xrm === undefined;
    }

    function ServiceFactory() {
        return undefined;
    }

    ServiceFactory.prototype.createDataRepository = function () {
        if (services.dataRepository === null) {
            services.dataRepository = useFakes() ?
                    new ARS.Fakes.FakeDataRepository() :
                    new ARS.DataRepository();
        }

        return services.dataRepository;
    };

    ServiceFactory.prototype.createFetchXmlService = function () {
        return ARS.Services.FetchXmlService;
    };

    ServiceFactory.prototype.createWorkOrderService = function () {
        var fetchXmlService, repo;
        if (services.workOrderService === null) {
            if (useFakes()) {
                services.workOrderService =
                    new ARS.Fakes.FakeWorkOrderService();
            } else {
                fetchXmlService = this.createFetchXmlService();

                repo = this.createDataRepository();
                services.workOrderService =
                    new ARS.Services.WorkOrderService(fetchXmlService, repo);
            }
        }

        return services.workOrderService;
    };

    ServiceFactory.prototype.createServiceAppointmentService = function (geo) {
        var techService;

        if (services.serviceAppointmentService === null) {
            techService = this.createTechnicianService();

            if (useFakes()) {
                services.serviceAppointmentService =
                    new ARS.Fakes.FakeServiceAppointmentService(techService);
            } else {
                services.serviceAppointmentService =
                    new ARS.Services.ServiceAppointmentService(
                        this.createDataRepository(),
                        this.createWorkOrderService(),
                        techService,
                        geo,
                        this.createFetchXmlService());
            }
        }

        return services.serviceAppointmentService;
    };

    ServiceFactory.prototype.createTechnicianService = function () {
        var fetchXmlService;

        if (services.technicianService === null) {
            if (useFakes()) {
                services.technicianService =
                    new ARS.Fakes.FakeTechnicianService();
            } else {
                fetchXmlService = this.createFetchXmlService();
                services.technicianService =
                    new ARS.Services.TechnicianService(fetchXmlService);
            }
        }

        return services.technicianService;
    };

    ServiceFactory.prototype.createRegionService = function () {
        var repo;

        if (services.regionService === null) {
            if (useFakes()) {
                services.regionService = new ARS.Fakes.FakeRegionService();
            } else {
                repo = this.createDataRepository();
                services.regionService = new ARS.Services.RegionService(repo);
            }
        }

        return services.regionService;
    };

    ServiceFactory.prototype.createTimeService = function () {
        var fetchXmlService;

        if (services.timeService === null) {
            if (useFakes()) {
                services.timeService = new ARS.Fakes.FakeTimeService();
            } else {
                fetchXmlService = this.createFetchXmlService();
                services.timeService =
                    new ARS.Services.TimeService(fetchXmlService);
            }
        }

        return services.timeService;
    };

    ServiceFactory.prototype.createSettingsService = function () {
        var repo;

        if (services.settingsService === null) {
            repo = this.createDataRepository();
            services.settingsService = new ARS.Services.SettingsService(repo);
        }

        return services.settingsService;
    };

    return new ServiceFactory();
}());
