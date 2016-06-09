/*global ARS, Promise, moment */
/*jslint bitwise: true */

var ARS;
ARS = ARS || {};
ARS.Fakes = ARS.Fakes || {};
ARS.Fakes.FakeServiceAppointmentService = (function () {
    "use strict";

    function createGuid() {
        var template;
        template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        return template.replace(/[xy]/g, function (c) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function extractTechIds(filters) {
        var techFilter;

        filters = filters || [];

        techFilter = filters.first(function (filter) {
            return filter instanceof ARS.Filters.TechnicianFilter;
        });

        return techFilter ?
                techFilter.selectedTechnicians.pluck("technicianId") :
                "";
    }

    function mapDateTime(userDateTime) {
        return moment(userDateTime).utc().format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }

    function mapToModel(appointment) {
        if (!appointment) {
            return null;
        }

        var model, tech, workOrder;

        tech = appointment.technician;
        tech = ARS.Fakes.FakeTechnicianService.getById(tech);

        workOrder = appointment.incident;
        workOrder = ARS.Fakes.FakeWorkOrderService.getById(workOrder);

        model               = new ARS.Models.ServiceAppointment();
        model.technician    = tech;
        model.appointmentId = appointment.appointmentId;
        model.utcEnd        = mapDateTime(appointment.end);
        model.utcStart      = mapDateTime(appointment.start);
        model.workOrder     = workOrder;
        return model;
    }

    function DateRange(start, end) {
        this.start = start;
        this.end   = end;
    }

    DateRange.prototype.intersects = function (other) {
        if (this.end.isBefore(other.start)) {
            return false;
        }

        if (this.start.isAfter(other.end)) {
            return false;
        }

        return true;
    };

    DateRange.prototype.toString = function () {
        // for debugging
        return this.start.format() + " - " + this.end.format();
    };

    DateRange.fromFilters = function (filters) {
        var end, start;

        filters = filters || [];

        filters = filters.first(function (filter) {
            return filter instanceof ARS.Filters.DateRangeFilter;
        });

        start = moment.utc(filters.start);
        end   = moment.utc(filters.end);

        return new DateRange(start, end);
    };

    DateRange.fromAppointment = function (appointment) {
        var end, start;

        start = moment(appointment.start);
        end   = moment(appointment.end);
        return new DateRange(start, end);
    };

    function FakeServiceAppointmentService(technicianService) {
        if (!technicianService) {
            throw new Error("Missing parameter: technicianService");
        }

        this.technicianService = technicianService;
        this.appointments = [];
    }

    FakeServiceAppointmentService.prototype.getServiceAppointmentsAsync =
        function (filters) {
            var filterRange, techIds, results;

            techIds = extractTechIds(filters);
            filterRange = DateRange.fromFilters(filters);

            results = this.appointments.filter(function (appointment) {
                var range = DateRange.fromAppointment(appointment);

                if (filterRange.intersects(range) === false) {
                    return false;
                }

                return techIds.length === 0 ||
                    techIds.indexOf(appointment.technician) !== -1;
            }).map(mapToModel);

            return Promise.resolve(results);
        };

    FakeServiceAppointmentService.prototype.createServiceAppointmentAsync =
        function (workOrder, technician, userStart, userEnd) {
            if (!workOrder) {
                throw new Error("Missing parameter: workOrder");
            }

            if (!technician) {
                throw new Error("Missing parameter: technician");
            }

            if (!userStart) {
                throw new Error("Missing parameter: userStart");
            }

            if (!userEnd) {
                throw new Error("Missing parameter: userEnd");
            }

            userStart = moment(userStart).format("YYYY-MM-DD[T]HH:mm:ss");
            userEnd   = moment(userEnd).format("YYYY-MM-DD[T]HH:mm:ss");

            var appointment           = {};
            appointment.appointmentId = createGuid();
            appointment.technician    = technician.technicianId;
            appointment.incident      = workOrder.workOrderId;
            appointment.start         = userStart;
            appointment.end           = userEnd;

            this.appointments.push(appointment);
            return Promise.resolve(mapToModel(appointment));
        };

    FakeServiceAppointmentService.prototype.updateServiceAppointmentAsync =
        function (appointmentId, userStart, userEnd) {

            userStart = userStart ?
                moment(userStart).format("YYYY-MM-DD[T]HH:mm:ss") : null;

            userEnd = userEnd ?
                moment(userEnd).format("YYYY-MM-DD[T]HH:mm:ss") : null;

            this.appointments.filter(function (appointment) {
                return appointment.appointmentId === appointmentId;
            }).forEach(function (appointment) {

                if (userStart) {
                    appointment.start = userStart;
                }

                if (userEnd) {
                    appointment.end = userEnd;
                }
            });

            return Promise.resolve();
        };

    FakeServiceAppointmentService.prototype.deleteServiceAppointmentAsync =
        function (appointmentId) {
            this.appointments = this.appointments.filter(function (a) {
                return a.appointmentId !== appointmentId;
            });

            return Promise.resolve();
        };

    FakeServiceAppointmentService.prototype.getTechnicianCoordinatesAsync =
        function (tech) {
            var result              = {};
            result.addressComposite = tech.addressComposite;
            result.latLng           = tech.latLng;

            return Promise.resolve(result);
        };

    FakeServiceAppointmentService.prototype.getTechnicianDistanceAsync =
        function (tech, utcTime, to) {
            if (to instanceof ARS.Models.LatLng === false) {
                throw new TypeError("Expecting ARS.Models.LatLng");
            }

            return this
                .getTechnicianCoordinatesAsync(tech, utcTime)
                .then(function (location) {
                    var from = location ? location.latLng : null;

                    return from instanceof ARS.Models.LatLng ?
                            from.getDistanceInMiles(to) :
                            Infinity; // I can see the universe.
                });
        };

    return FakeServiceAppointmentService;
}());
