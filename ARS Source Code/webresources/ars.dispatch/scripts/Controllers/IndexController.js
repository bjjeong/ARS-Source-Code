/*global $, ARS, document, moment, Promise, window */

var ARS;
ARS = ARS || {};
ARS.Controllers = ARS.Controllers || {};
ARS.Controllers.IndexController = (function () {
    "use strict";
    /*jslint unparam: true */

    function IndexController(context) {
        this.getContext = function () {
            return context;
        };

        this.attach();
    }

    IndexController.prototype.attach = function () {
        var context, events;
        context = this.getContext();

        events = {};
        events.changeAllUsers        = this.onChangeAllUsers.bind(this);
        events.changeTechnician      = this.onChangeTechnician.bind(this);
        events.changeRegion          = this.onChangeRegion.bind(this);
        events.changeTicket          = this.onChangeTicket.bind(this);
        events.changeWorkOrderFilter = this.onChangeWorkOrderFilter.bind(this);
        $(context.searchFilterFactory).on(events);

        events = {};
        events.changeWorkOrder  = this.onChangeWorkOrder.bind(this);
        events.sortByTechnician = this.onSortByTechnician.bind(this);
        events.sortByWorkOrder  = this.onSortByWorkOrder.bind(this);
        events.dragStart        = this.onInteractionStart.bind(this);
        events.dragStop         = this.onInteractionStop.bind(this);
        $(context.workOrderView).on(events);

        events = {};
        events.dropAppointment   = this.onDropAppointment.bind(this);
        events.updateAppointment = this.onUpdateAppointment.bind(this);
        events.removeAppointment = this.onRemoveAppointment.bind(this);
        events.selectTime        = this.onSelectTime.bind(this);
        events.renderCalendar    = this.onRenderCalendar.bind(this);
        events.interactionStart  = this.onInteractionStart.bind(this);
        events.interactionStop   = this.onInteractionStop.bind(this);
        events.toggleCompleted   = this.onToggleCompleted.bind(this);
        $(context.calendarView).on(events);

        events = {};
        events.heartbeat = this.onHeartbeat.bind(this);
        $(context.heartbeatService).on(events);

        events = {};
        events.scroll = this.onScrollWorkOrders.bind(this).debounce(500);
        $("#workOrders").on(events);
    };

    IndexController.prototype.onHeartbeat = function () {
        var context = this.getContext();

        // This is supposed to avoid bothering the user.  To that end,
        // there is no busy animation, and we skip zooming the map around.

        context.heartbeatService.stop();
        context.updateAppointmentsAsync().then(function () {
            context.heartbeatService.start();
        });
    };

    IndexController.prototype.onInteractionStart = function () {
        this.getContext().heartbeatService.stop();
    };

    IndexController.prototype.onInteractionStop = function () {
        this.getContext().heartbeatService.start();
    };

    IndexController.prototype.onRenderCalendar = function () {
        var context = this.getContext();

        context.animationService.showBusyAnimation();
        context.heartbeatService.stop();

        return context.updateAppointmentsAsync().then(function () {
            context.mapView.zoomToPins();
            context.heartbeatService.start();
        }).finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onSelectTime = function () {
        var context = this.getContext();

        if (context.searchFilterFactory.selectedTechnicians.length !== 1) {
            return;
        }

        context.animationService.showBusyAnimation();

        return context
            .loadWorkOrdersAndDistancesAsync()
            .finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onUpdateAppointment =
        function (ignore, appointment, startDate, endDate, timeZone) {
            var context, tasks, times, userZone;

            context  = this.getContext();
            times    = context.timeService;
            userZone = context.userTimeZone;

            context.animationService.showBusyAnimation();
            context.heartbeatService.stop();

            tasks    = [];
            tasks[0] = times.convertTimeZone(startDate, timeZone, userZone);
            tasks[1] = times.convertTimeZone(endDate, timeZone, userZone);

            Promise.all(tasks).then(function (results) {
                var id, userStart, userEnd;
                id        = appointment.appointmentId;
                userStart = results[0];
                userEnd   = results[1];

                return context.serviceAppointmentService
                    .updateServiceAppointmentAsync(id, userStart, userEnd);
            }).then(function () {
                return context.updateAppointmentsAsync();
            }).then(function () {
                context.mapView.zoomToPins();
                context.heartbeatService.start();
            }).finally(context.animationService.hideBusyAnimation);
        };

    IndexController.prototype.onRemoveAppointment =
        function (ignore, appointment) {
            var context = this.getContext();

            context.animationService.showBusyAnimation();
            context.heartbeatService.stop();

            function unassign() {
                return context.workOrderService
                    .unassignWorkOrder(appointment.workOrder);
            }

            context.serviceAppointmentService
                .deleteServiceAppointmentAsync(appointment.appointmentId)
                .then(unassign)
                .then(function () {
                    var nextSteps = [];
                    nextSteps[0]  = context.updateWorkOrdersAsync();
                    nextSteps[1]  = context.updateAppointmentsAsync();
                    return Promise.all(nextSteps);
                })
                .then(function () {
                    context.mapView.zoomToPins();
                    context.heartbeatService.start();
                })
                .finally(context.animationService.hideBusyAnimation);
        };

    IndexController.prototype.onDropAppointment =
        function (ev, workOrder, startDate, timeZone) {
            var context, tech, msg;

            context = this.getContext();
            tech    = context.searchFilterFactory.selectedTechnicians;

            if (tech.length !== 1) {
                msg =
                    "Please select exactly one technician before dropping " +
                    "a work order on the calendar.";

                context.notificationService.showNotification(msg);
                ev.preventDefault();
                return false;
            }

            tech = tech[0];

            context.animationService.showBusyAnimation();
            context.heartbeatService.stop();
            context
                .addAppointmentAsync(tech, workOrder, startDate, timeZone)
                .then(function () {
                    context.mapView.zoomToPins();
                    context.heartbeatService.start();
                })
                .finally(context.animationService.hideBusyAnimation);
        };

    IndexController.prototype.onToggleCompleted =
        function (ignore, workOrder) {
            var context;

            context = this.getContext();

            context.animationService.showBusyAnimation();
            context.heartbeatService.stop();
            context
                .toggleCompleted(workOrder)
                .then(function () {
                    var tasks = [];
                    tasks[0]  = context.updateWorkOrdersAsync();
                    tasks[1]  = context.updateAppointmentsAsync();
                    return Promise.all(tasks);
                })
                .then(function () {
                    context.mapView.zoomToPins();
                    context.heartbeatService.start();
                })
                .finally(context.animationService.hideBusyAnimation);
        };

    IndexController.prototype.onScrollWorkOrders = function () {
        var container, context, scrollHeight, top, totalHeight;

        context      = this.getContext();
        container    = $("#workOrders");
        top          = container.scrollTop();
        totalHeight  = container.innerHeight();
        scrollHeight = container.prop("scrollHeight");

        if (top + totalHeight >= scrollHeight) {
            context.animationService.showBusyAnimation();

            context
                .loadMoreWorkOrdersAsync()
                .then(context.mapView.zoomToPins.bind(context.mapView))
                .finally(context.animationService.hideBusyAnimation);
        }
    };

    IndexController.prototype.onSortByWorkOrder = function () {
        /// <summary>
        /// Sort technicians by proximity to selected work order.
        /// </summary>

        var context, message, workOrder;
        context   = this.getContext();
        workOrder = context.workOrderView.getSelectedWorkOrder();

        if (!workOrder) {
            message = "Please select a work order.";
            context.notificationService.showNotification(message);
            return;
        }

        if (workOrder.latLng instanceof ARS.Models.LatLng === false) {
            message = "The selected work order has an invalid address.";
            context.notificationService.showNotification(message);
            return;
        }

        context.animationService.showBusyAnimation();
        context
            .sortTechniciansByDistanceToWorkOrderAsync(workOrder)
            .finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onSortByTechnician = function () {
        /// <summary>
        /// Sort work orders by proximity to the selected technician.
        /// </summary>

        var context = this.getContext();

        context.animationService.showBusyAnimation();

        context.loadWorkOrdersAndDistancesAsync()
            .then(function (withDistances) {
                context.clearWorkOrders();
                context.addWorkOrders(withDistances);
            })
            .finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onChangeWorkOrderFilter = function () {
        var context = this.getContext();

        context.animationService.showBusyAnimation();

        context
            .updateWorkOrdersAsync()
            .then(context.mapView.zoomToPins.bind(context.mapView))
            .finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onChangeTicket =
        IndexController.prototype.onChangeWorkOrderFilter;

    IndexController.prototype.onChangeAllUsers =
        IndexController.prototype.onChangeWorkOrderFilter;

    IndexController.prototype.onChangeRegion = function () {
        var context, tasks;

        context = this.getContext();
        tasks   = [];

        context.animationService.showBusyAnimation();
        context.heartbeatService.stop();
        tasks.push(context.updateTechniciansAsync());
        tasks.push(context.updateWorkOrdersAsync());

        Promise.all(tasks).then(function () {
            context.mapView.zoomToPins();
            context.heartbeatService.start();
        }).finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onChangeTechnician = function () {
        var context, techs;

        context = this.getContext();
        techs = context.searchFilterFactory.selectedTechnicians;
        context.workOrderView.clearDistances();

        if (techs.length === 0) {
            context.mapView.clearTechnicians();
            context.calendarView.technicians = techs;
            context.clearAppointments();
            context.mapView.zoomToPins();
            return;
        }

        context.animationService.showBusyAnimation();
        context.heartbeatService.stop();

        context.mapView.clearTechnicians();
        context.mapView.addTechnicians(techs);
        context.calendarView.technicians = techs;

        context.updateAppointmentsAsync().then(function () {
            context.mapView.zoomToPins();
            context.heartbeatService.start();
        }).finally(context.animationService.hideBusyAnimation);
    };

    IndexController.prototype.onChangeWorkOrder = function () {
        var context, workOrder;
        context = this.getContext();
        workOrder = context.workOrderView.getSelectedWorkOrder();
        context.updateWorkOrderDetail();
        context.mapView.selectWorkOrder(workOrder);
    };

    return IndexController;
}());
