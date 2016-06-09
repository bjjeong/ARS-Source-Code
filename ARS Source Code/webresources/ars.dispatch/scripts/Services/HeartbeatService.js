/*global $, window */

var ARS;
ARS = window.ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.HeartbeatService = (function () {
    "use strict";

    // The heartbeat service makes repeated queries to the service for the
    // status of appointments on the current schedule.
    //
    // When a technician arrives to an appointment, they are supposed to clock
    // in, setting the appointment's work order's status to "in progress."
    //
    // If an appointment's start date is in the past, and if the appointment's
    // work order's status is not "in progress," then we consider the
    // technician as being late.
    //
    // We need to update the calendar's rendering of appointments when a
    // technician is running late.
    //
    // It is possible that two technicians might be scheduled to the same
    // work order.  When the first one clocks in, the work order's status is
    // set to "in progress," so we have no way of knowing if the second
    // technician is late or not.  We have chosen to ignore this as
    // of 2015-08-18.

    function HeartbeatService() {
        var instance;
        instance         = {};
        instance.timeout = null;

        this.start = function () {
            this.stop();
            instance.timeout = window.setTimeout(this.beat.bind(this), 60000);
        };

        this.stop = function () {
            window.clearTimeout(instance.timeout);
            instance.timeout = null;
        };
    }

    HeartbeatService.prototype.beat = function () {
        var evt;
        evt = new $.Event("heartbeat");

        // Stop any other beat activity. Index is responsible for listening
        // for this event, doing the async action, and restarting
        // the heartbeat.
        this.stop();

        $(this).triggerHandler(evt);
    };

    return HeartbeatService;
}());
