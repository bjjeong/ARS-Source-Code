/*global $, ARS, document, moment */

var ARS;
ARS = ARS || {};
ARS.Views = ARS.Views || {};
ARS.Views.CalendarView = (function () {
    "use strict";
    /*jslint unparam: true */

    function eventRender(instance, event, element) {
        var techs, timeZone;
        techs = instance.self.technicians;
        timeZone = instance.self.selectedTimeZone;

        ARS.Views.EventRendering.renderEvent(event, timeZone, techs, element);
    }

    function prepareTimeZoneDropdown(instance) {
        var control;

        function sortByName(a, b) {
            var x, y;
            x = a.userInterfaceName.toLowerCase();
            y = b.userInterfaceName.toLowerCase();
            return x > y ? 1 : x < y ? -1 : 0;
        }

        control = instance.timeZoneSelect;
        control.userTimeZone = instance.userTimeZone;

        Object
            .keys(instance.timeZones)
            .map(function (key) {
                return instance.timeZones[key];
            })
            .filter(Boolean)
            .sort(sortByName)
            .forEach(control.addSupportedTimeZone, control);

        control.prependTo(instance.container.find(".fc-toolbar .fc-right"));
    }

    function prepareCalendar(instance) {
        var options               = {};
        options.defaultView       = "agendaDay";
        options.dragScroll        = false;
        options.dropAccept        = ".work-order";
        options.droppable         = true;
        options.editable          = true;
        options.eventDragStart    = instance.behavior.onInteractionStart;
        options.eventDragStop     = instance.behavior.onInteractionStop;
        options.eventDrop         = instance.behavior.onUpdateAppointment;
        options.eventReceive      = instance.behavior.onDropAppointment;
        options.eventRender       = eventRender.bind(null, instance);
        options.eventResize       = instance.behavior.onUpdateAppointment;
        options.eventResizeStart  = instance.behavior.onInteractionStart;
        options.eventResizeStop   = instance.behavior.onInteractionStop;
        options.events            = [];
        options.header            = {};
        options.header.center     = "title";
        options.header.left       = "prev,next today";
        options.header.right      = "agendaWeek,agendaDay";
        options.selectableTime    = true;
        options.selectOverlap     = false;
        options.selectTime        = instance.behavior.onSelectTime;
        options.slotDuration      = "01:00:00";
        options.slotEventOverlap  = false;
        options.timezone          = "local";
        options.viewRender        = instance.behavior.onViewRender;

        instance.container.fullCalendar(options);
    }

    function Behavior(instance) {
        var firstRender = true;

        this.onInteractionStart = function (ignore, jsEvent) {
            var bubble = new $.Event(jsEvent, { type: "interactionStart" });
            $(instance.self).triggerHandler(bubble);
        };

        this.onInteractionStop = function (ignore, jsEvent) {
            var bubble = new $.Event(jsEvent, { type: "interactionStop" });
            $(instance.self).triggerHandler(bubble);
        };

        this.onUpdateAppointment = function (event, delta, ignore, jsEvent) {
            var bubble, data, props;

            props      = {};
            props.type = "updateAppointment";
            bubble     = new $.Event(jsEvent, props);
            data       = [];
            data[0]    = event.appointment;
            data[1]    = event.start.toDate();
            data[2]    = event.end.toDate();
            data[3]    = instance.self.selectedTimeZone;

            $(instance.self).triggerHandler(bubble, data);
        };

        this.onDropAppointment = function (event) {
            var bubble, data;

            bubble = new $.Event("dropAppointment");
            data = [];

            data[0] = instance.workOrderProvider
                .getWorkOrderById(event.workOrderId);

            data[1] = event.start.toDate();
            data[2] = instance.self.selectedTimeZone;

            $(instance.self).triggerHandler(bubble, data);

            if (bubble.isDefaultPrevented()) {
                instance.container.fullCalendar("removeEvents", function (e) {
                    return e === event;
                });
            }
        };

        this.onClick_ToggleComplete = function (ev) {
            var bubble, data, props, workOrder;
            workOrder  = $(ev.target).data("appointment-id");
            workOrder  = instance.self.getAppointmentById(workOrder);
            workOrder  = workOrder ? workOrder.workOrder : null;

            if (!workOrder) {
                return;
            }

            props      = {};
            props.type = "toggleCompleted";
            bubble     = new $.Event(ev, props);
            data       = [];
            data[0]    = workOrder;
            $(instance.self).triggerHandler(bubble, data);
        };

        this.onClick_RemoveAppointment = function (ev) {
            var appointmentId, bubble, data, props;

            appointmentId = $(ev.target).attr("data-appointment-id");
            props         = {};
            props.type    = "removeAppointment";
            bubble        = new $.Event(ev, props);
            data          = [];
            data[0]       = instance.self.getAppointmentById(appointmentId);

            $(instance.self).triggerHandler(bubble, data);
        };

        this.onSelectTime = function (ignore, end, jsEvent, cell) {
            instance.selectedTime = end;
            instance.container.data("selectedTime", cell);

            var bubble, props;
            props = {};
            props.type = "selectTime";
            bubble = new $.Event(jsEvent, props);

            $(instance.self).triggerHandler(bubble);
        };

        this.onViewRender = function () {
            var bubble, data;

            // This fires a render event during initialization, which we
            // want to skip.  Our initialization step includes other async
            // steps that also populate the calendar.
            if (firstRender) {
                firstRender = false;
                return;
            }

            bubble        = new $.Event("renderCalendar");
            data          = [];
            data[0]       = {};
            data[0].start = instance.self.scheduleStart;
            data[0].end   = instance.self.scheduleEnd;
            $(instance.self).triggerHandler(bubble, data);
        };

        this.onChangeTimeZone = function () {
            var val =
                instance.timeZoneSelect.selectedTimeZone ||
                instance.userTimeZone;

            if (val.equals(instance.lastSelectedTimeZone) === false) {
                instance.lastSelectedTimeZone = val;
                instance.behavior.onViewRender();
            }
        };

        this.attach = function () {
            var ev, sel, fn;
            ev = "click";
            sel = ".remove-appointment";
            fn = this.onClick_RemoveAppointment;

            $(instance.container).on(ev, sel, fn);

            sel = "[data-action='toggleComplete']";
            fn = this.onClick_ToggleComplete;
            $(instance.container).on(ev, sel, fn);

            ev = "change";
            fn = this.onChangeTimeZone;
            $(instance.timeZoneSelect).on(ev, fn);
        };
    }

    function updateTechnicianTimeZones(instance) {
        var techs = instance.events
            .pluck("appointment.technician")
            .concat(instance.technicians);

        instance.timeZoneSelect.updateTechnicianTimeZones(techs);
    }

    function CalendarView(
        container,
        workOrderProvider,
        userTimeZone,
        timeZones
    ) {
        if (!container) {
            throw new Error("Container is required");
        }

        if (!workOrderProvider) {
            throw new Error("workOrderProvider is required");
        }

        if (typeof workOrderProvider.getWorkOrderById !== "function") {
            throw new Error(
                "workOrderProvider must implement getWorkOrderById");
        }

        if (!userTimeZone) {
            throw new Error("userTimeZone is required");
        }

        if (!timeZones) {
            throw new Error("timeZones is required");
        }

        var instance                   = {};
        instance.behavior              = new Behavior(instance);
        instance.container             = $(container);
        instance.events                = [];
        instance.lastSelectedTimeZone  = null;
        instance.self                  = this;
        instance.technicians           = [];
        instance.timeZones             = timeZones;
        instance.timeZoneSelect        = new ARS.Controls.TimeZoneDropdown();
        instance.userTimeZone          = userTimeZone;
        instance.workOrderProvider     = workOrderProvider;

        Object.defineProperties(this, {
            // FullCalendar has a concept of "ambiguously-timed" moments which
            // do not make a whole lot of sense.  We need times on these
            // things. FullCalendar gives us "moment" objects, but from some
            // strange, internal, modified version of momentjs that does not
            // behave like normal momentjs.
            //
            // This code goes from FullCalendar's Moment, to a Date, to a real
            // Moment, then modifies the time, then sets future interaction to
            // treat this as UTC.
            //
            // This seems stupid, but it is FullCalendar's stupid, we are just
            // trying to convert out of it.
            scheduleStart: {
                get: function () {
                    var result = instance.container.fullCalendar("getView");
                    result = moment(result.intervalStart);
                    result = result.startOf("day");
                    return result;
                }
            },

            // I can't seem to figure out what fullCalendar is doing when it
            // tries to calculate the end interval.  In theory, this should be
            // much like the scheduleStart function, since fullCalendar
            // provides a view property called intervalEnd.  However, this
            // property seems to be off by as much as a day at a time. I don't
            // know why, and I don't have time to dig into it.
            scheduleEnd: {
                get: function () {
                    var rangeSize, result, view;

                    view = instance.container.fullCalendar("getView").name;

                    rangeSize            = {};
                    rangeSize.agendaDay  = "day";
                    rangeSize.agendaWeek = "week";
                    rangeSize            = rangeSize[view];

                    result = instance.container.fullCalendar("getView");
                    result = moment(result.intervalStart);
                    result = result.endOf(rangeSize);
                    return result;
                }
            },

            selectedTime: {
                get: function () {
                    return instance.selectedTime ||
                        instance.container.fullCalendar("getDate");
                }
            },

            selectedTimeZone: {
                get: function () {
                    var selected = instance.timeZoneSelect.selectedTimeZone;
                    return selected || instance.userTimeZone;
                }
            },

            technicians: {
                get: function () {
                    return instance.technicians.slice(0);
                },
                set: function (value) {
                    if ($.isArray(value) === false) {
                        throw new TypeError("Expecting an array.");
                    }

                    instance.technicians = value.slice(0);
                    updateTechnicianTimeZones(instance);
                }
            }
        });

        this.getAppointmentById = function (appointmentId) {
            var event;

            event = instance.events.first(function (e) {
                return e.appointment.appointmentId === appointmentId;
            });

            return event ? event.appointment : null;
        };

        this.clearAppointments = function () {
            instance.events.length = 0;
            instance.container.fullCalendar("removeEvents");
            updateTechnicianTimeZones(instance);
        };

        this.addAppointment = function (appointment) {
            var event, schedule;

            schedule = appointment.getLocalSchedule(this.selectedTimeZone);

            event               = {};
            event.appointmentId = appointment.appointmentId;
            event.start         = schedule.start;
            event.end           = schedule.end;

            // The "id" property here has special meaning to fullCalendar.
            // It is used to group various appointments together.
            event.id = appointment.appointmentId;

            event.title =
                appointment.workOrder.ticketNumber + "\r\n" +
                appointment.workOrder.locationName + "\r\n" +
                appointment.workOrder.addressComposite;

            event.appointment = appointment;

            instance.events.push(event);
            instance.container.fullCalendar("renderEvent", event);
            updateTechnicianTimeZones(instance);
        };

        prepareCalendar(instance);
        prepareTimeZoneDropdown(instance);
        ARS.Views.EventRendering.initializeTooltips(instance.container);
        instance.behavior.attach();
    }

    CalendarView.prototype.addAppointments = function (appointments) {
        appointments = appointments || [];
        appointments.forEach(this.addAppointment, this);
    };

    return CalendarView;
}());
