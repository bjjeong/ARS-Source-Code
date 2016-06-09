/*global moment */

var ARS;
ARS = ARS || {};
ARS.Models = ARS.Models || {};
ARS.Models.ServiceAppointment = (function () {
    "use strict";

    function getterFor(context, name) {
        return function () {
            return context[name];
        };
    }

    function stringValueFor(context, name) {
        return {
            get: getterFor(context, name),
            set: function (value) {
                context[name] =  value === null || value === undefined ?
                    null : String(value).trim();
            }
        };
    }

    function typedValueFor(context, name, Type) {
        return {
            get: getterFor(context, name),
            set: function (value) {
                context[name] = value instanceof Type ? value : null;
            }
        };
    }

    function workOrderValueFor(context, name) {
        return typedValueFor(context, name, ARS.Models.WorkOrderModel);
    }

    function techValueFor(context, name) {
        return typedValueFor(context, name, ARS.Models.Technician);
    }

    function ServiceAppointment() {
        var instance = {};
        instance.appointmentId  = null;
        instance.schedule       = {};
        instance.technician     = null;
        instance.utcEnd         = null;
        instance.utcStart       = null;
        instance.workOrder      = null;

        Object.defineProperties(this, {
            appointmentId: stringValueFor(instance, "appointmentId"),
            utcStart:      stringValueFor(instance, "utcStart"),
            utcEnd:        stringValueFor(instance, "utcEnd"),
            technician:    techValueFor(instance, "technician"),
            workOrder:     workOrderValueFor(instance, "workOrder")
        });

        this.addLocalSchedule = function (timeZone, zoneStart, zoneEnd) {
            var schedule = {};
            schedule.start = zoneStart;
            schedule.end   = zoneEnd;
            instance.schedule[timeZone.standardName] = Object.freeze(schedule);
        };

        this.getLocalSchedule = function (timeZone) {
            var name = timeZone.standardName;
            if (instance.schedule.hasOwnProperty(name) === false) {
                throw new RangeError("Local schedule not found for " + name);
            }

            return instance.schedule[name];
        };
    }

    Object.defineProperties(ServiceAppointment.prototype, {
        technicianIsLate: {
            get: function () {
                var isLate, hasStatus, hasStart, status, utcStart, utcNow;

                hasStatus = this.workOrder && this.workOrder.status;
                hasStart  = this.utcStart;

                if (!(hasStatus && hasStart)) {
                    return false;
                }

                status   = this.workOrder.status;
                utcStart = moment.utc(this.utcStart);
                utcNow   = moment.utc();

                isLate =
                    utcStart.isBefore(utcNow) &&
                    status === "Scheduled";

                return Boolean(isLate);
            }
        }
    });

    ServiceAppointment.prototype.equals = function (other) {
        var x, y;

        if (other instanceof ServiceAppointment === false) {
            return false;
        }

        x = String(this.appointmentId || "").trim().toLowerCase();
        y = String(other.appointmentId || "").trim().toLowerCase();

        return x === y;
    };

    return ServiceAppointment;
}());
