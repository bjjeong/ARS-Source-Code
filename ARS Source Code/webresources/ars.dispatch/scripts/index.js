/*global $, ARS, document, moment, Promise, window */

var ARS;
ARS = ARS || {};
ARS.defaultCallback = function() {
    "use strict";
    throw new Error("Not implemented yet");
};

ARS.Index = (function () {
    "use strict";

    // ReSharper disable once InconsistentNaming
    // Match the namespace spelling.
    var Index;

    Index = {};

    function byDistance(a, b) {
        if (a.distance < b.distance) {
            return -1;
        }

        if (a.distance > b.distance) {
            return 1;
        }

        return 0;
    }

    function loadAppointments() {
        var end, start, tasks, tz;

        tz    = Index.calendarView.selectedTimeZone;
        start = Index.calendarView.scheduleStart;
        end   = Index.calendarView.scheduleEnd;
        tasks = [];
        tasks[0] = Index.timeService.utcTimeFromLocalTime(start, tz);
        tasks[1] = Index.timeService.utcTimeFromLocalTime(end, tz);

        return Promise.all(tasks).then(function (results) {
            var filters;

            start = results[0];
            end   = results[1];

            filters = [];
            filters[0] = Index.searchFilterFactory.getTechnicianFilter();
            filters[1] = new ARS.Filters.DateRangeFilter(start, end);

            return Index.serviceAppointmentService
                .getServiceAppointmentsAsync(filters);
        }).then(function (appointments) {
            return Index.timeService.setAppointmentTimeZones(appointments, tz);
        });
    }

    // ReSharper disable once Html.EventNotResolved
    // This is some bluebird sorcery.
    window.addEventListener("unhandledrejection", function (e) {
        e.preventDefault();
        Index.notificationService.showError(e.detail.reason);
        Index.animationService.hideBusyAnimation(true);
    });

    Index.updateRegionsAsync = function () {
        return Index.regionService.getRegionsAsync().then(function (regions) {
            Index.searchFilterFactory.clearRegions();
            Index.searchFilterFactory.addRegions(regions);
            Index.searchFilterFactory.selectFirstRegion();
            return regions;
        });
    };

    Index.clearAppointments = function () {
        Index.mapView.clearAppointments();
        Index.calendarView.clearAppointments();
    };

    Index.addAppointments = function (appointments) {
        Index.mapView.addAppointments(appointments);
        Index.calendarView.addAppointments(appointments);
    };

    Index.updateAppointmentsAsync = function () {
        return loadAppointments().then(function (appointments) {
            Index.clearAppointments();
            Index.addAppointments(appointments);
            return appointments;
        });
    };

    Index.addAppointmentAsync = function (tech, workOrder, start, timeZone) {
        var tasks;

        tasks = [];

        tasks[0] = Index.workOrderService
            .getWorkOrderDuration(workOrder.workOrderId);

        tasks[1] = Index.timeService
            .convertTimeZone(start, timeZone, this.userTimeZone);

        return Promise.all(tasks).then(function (results) {
            var duration, userEnd, userStart;

            duration  = moment.duration(results[0], "hours");
            userStart = moment(results[1]);
            userEnd   = moment(userStart).add(duration);

            tasks = [];

            tasks[0] = Index.workOrderService.assignWorkOrder(workOrder);

            tasks[1] = Index.serviceAppointmentService
                .createServiceAppointmentAsync(
                    workOrder,
                    tech,
                    userStart,
                    userEnd
                );

            return Promise.all(tasks);
        }).then(function () {
            tasks = [];
            tasks[0]  = Index.updateWorkOrdersAsync();
            tasks[1]  = Index.updateAppointmentsAsync();
            return Promise.all(tasks);
        });
    };

    Index.clearTechnicians = function () {
        Index.searchFilterFactory.clearTechnicians();
        Index.mapView.clearTechnicians();
        Index.calendarView.technicians = [];
        Index.clearAppointments();
    };

    Index.loadTechniciansAsync = function () {
        var filters = [];
        filters.push(Index.searchFilterFactory.getRegionFilter());
        return Index.technicianService.getTechniciansAsync(filters);
    };

    Index.updateTechniciansAsync = function () {
        return Index.loadTechniciansAsync().then(function (technicians) {
            Index.clearTechnicians();
            Index.searchFilterFactory.addTechnicians(technicians);
            Index.searchFilterFactory.selectFirstTechnician();

            var selected = Index.searchFilterFactory.selectedTechnicians;
            Index.mapView.addTechnicians(selected);
            Index.calendarView.technicians = selected;

            if (selected.length > 0) {
                return Index.updateAppointmentsAsync().then(function () {
                    return technicians;
                });
            }

            return technicians;
        });
    };

    Index.sortTechniciansByDistanceToWorkOrderAsync = function (workOrder) {
        var tasks, time, timeZone;

        time     = Index.calendarView.selectedTime;
        timeZone = Index.calendarView.selectedTimeZone;

        tasks    = [];
        tasks[0] = Index.loadTechniciansAsync();
        tasks[1] = Index.timeService.utcTimeFromLocalTime(time, timeZone);

        return Promise.all(tasks).then(function (results) {
            var techs, to, utcTime;

            techs   = results[0];
            utcTime = results[1];
            to      = workOrder.latLng;

            tasks = techs.map(function (tech) {
                return Index.serviceAppointmentService
                    .getTechnicianDistanceAsync(tech, utcTime, to)
                    .then(function (distance) {
                        var viewModel      = {};
                        viewModel.tech     = tech;
                        viewModel.distance = distance;
                        return viewModel;
                    });
            });

            return Promise.all(tasks);
        }).then(function (withDistances) {
            var selected, sorted;

            sorted = withDistances.sort(byDistance).map(function (a) {
                return a.tech;
            });

            selected = Index.searchFilterFactory.selectedTechnicians.first();

            Index.searchFilterFactory.clearTechnicians();
            Index.searchFilterFactory.addTechnicians(sorted);

            // Reselect the same tech, so we don't have to clear and re-load
            // the map, appointments, or calendar.  If the user wants to
            // select a different tech, they can do that themselves.
            if (selected) {
                Index.searchFilterFactory
                    .selectTechnicianById(selected.technicianId);
            }
        });
    };

    Index.clearWorkOrders = function () {
        Index.workOrderView.clearWorkOrderDetails();
        Index.workOrderView.clearWorkOrders();
        Index.mapView.clearWorkOrders();
    };

    Index.addWorkOrders = function (workOrderPage) {
        Index.workOrderView.addWorkOrders(workOrderPage);
        Index.mapView.addWorkOrders(workOrderPage.workOrders);
    };

    Index.loadWorkOrdersAsync = function () {
        var criteria, filters, paging;
        criteria = Index.searchFilterFactory;

        filters = [];
        filters.push(criteria.getRegionFilter());
        filters.push(criteria.getWorkOrderFilter());
        filters.push(criteria.getAllUsersFilter());
        filters.push(criteria.getTicketFilter());

        paging = {};
        paging.page = Index.workOrderView.page + 1;
        paging.cookie = Index.workOrderView.pagingCookie;

        return Index.workOrderService.getWorkOrdersAsync(filters, paging);
    };

    Index.loadWorkOrdersAndDistancesAsync = function () {
        var self, tech, time, timeZone;

        self = this;

        tech = this.searchFilterFactory.selectedTechnicians;

        if (tech.length !== 1) {
            throw new Error("Please select exactly one technician.");
        }

        tech     = tech[0];
        time     = this.calendarView.selectedTime;
        timeZone = this.calendarView.selectedTimeZone;
        Index.clearWorkOrders();

        return this.timeService
            .utcTimeFromLocalTime(time, timeZone)
            .then(function (utcTime) {
                return self.serviceAppointmentService
                    .getTechnicianCoordinatesAsync(tech, utcTime);
            })
            .then(function (techLocation) {
                var latLng = techLocation ? techLocation.latLng : null;

                function getDistances(workOrderPage) {
                    var workOrders = workOrderPage.workOrders;
                    return Index.geoLocationService
                        .getWorkOrderDistancesAsync(latLng, workOrders)
                        .then(function (withDistances) {
                            workOrderPage.workOrders = withDistances;
                            return workOrderPage;
                        });
                }

                if (latLng instanceof ARS.Models.LatLng === false) {
                    throw new Error("Cannot plot technician location.");
                }

                return Index.loadWorkOrdersAsync().then(getDistances);
            })
            .then(function (withDistances) {
                withDistances.workOrders =
                    withDistances.workOrders.sort(byDistance);

                Index.addWorkOrders(withDistances);
                return withDistances;
            });
    };

    Index.updateWorkOrdersAsync = function () {
        Index.clearWorkOrders();
        return Index.loadWorkOrdersAsync().then(Index.addWorkOrders);
    };

    Index.loadMoreWorkOrdersAsync = function () {
        // Skip clearing existing work orders.
        return Index.loadWorkOrdersAsync().then(Index.addWorkOrders);
    };

    Index.toggleCompleted = function (workOrder) {
        return Index.workOrderService.toggleCompleted(workOrder);
    };

    Index.updateWorkOrderDetail = function () {
        var selected = Index.workOrderView.getSelectedWorkOrder();

        if (selected && selected.workOrderId) {
            Index.workOrderView.showWorkOrderDetails(selected);
        } else {
            Index.workOrderView.clearWorkOrderDetails();
        }
    };

    function initialize() {
        Index.animationService    = ARS.Services.AnimationService;
        Index.heartbeatService    = new ARS.Services.HeartbeatService();
        Index.notificationService = new ARS.Services.NotificationService();
        Index.serviceFactory      = ARS.ServiceFactory;
        Index.templateService     = new ARS.Services.TemplateService();
        Index.viewFactory         = new ARS.ViewFactory();

        Index.workOrderView = Index.viewFactory
            .createWorkOrderView(Index.templateService);

        Index.animationService.showBusyAnimation();

        ARS.GlobalContext.load()
            .then(function () {
                var factory, nextTasks, repo;

                factory = Index.serviceFactory;
                repo    = factory.createDataRepository();

                Index.dataRepository    = repo;
                Index.regionService     = factory.createRegionService();
                Index.settingsService   = factory.createSettingsService();
                Index.technicianService = factory.createTechnicianService();
                Index.timeService       = factory.createTimeService();
                Index.workOrderService  = factory.createWorkOrderService();

                nextTasks = [];
                nextTasks[0] = Index.settingsService.getBingMapsKeyAsync();
                nextTasks[1] = Index.workOrderService.getStatusCodesAsync();
                nextTasks[2] = Index.timeService.getCurrentUserTimeZoneAsync();
                nextTasks[3] = Index.timeService.getSupportedTimeZonesAsync();
                return Promise.all(nextTasks);
            })
            .then(function (results) {
                var bingMapsKey, factory, geo, incidentStatusCodes,
                    timeZones, userTime;

                bingMapsKey         = results[0];
                incidentStatusCodes = results[1];
                userTime            = results[2];
                timeZones           = results[3];

                Index.userTimeZone = userTime;

                Index.searchFilterFactory = new ARS.SearchFilterFactory(
                    Index.templateService,
                    incidentStatusCodes);

                factory = Index.serviceFactory;

                geo = new ARS.Services.GeoLocationService(bingMapsKey);
                Index.geoLocationService = geo;

                Index.serviceAppointmentService =
                    factory.createServiceAppointmentService(geo);

                Index.mapView = Index.viewFactory.createMapView(
                    bingMapsKey,
                    Index.geoLocationService,
                    Index.notificationService
                );

                Index.calendarView = Index.viewFactory.createCalendarView(
                    Index.workOrderView,
                    userTime,
                    timeZones
                );

                Index.indexController =
                    new ARS.Controllers.IndexController(Index);

                return Index.updateRegionsAsync();
            })
            .then(function () {
                var nextTasks = [];
                nextTasks[0] = Index.updateWorkOrdersAsync();
                nextTasks[1] = Index.updateTechniciansAsync();
                return Promise.all(nextTasks);
            })
            .then(function () {
                Index.mapView.zoomToPins();
                Index.heartbeatService.start();
            })
            .finally(Index.animationService.hideBusyAnimation);
    }

    $(initialize);

    return Index;
}());
