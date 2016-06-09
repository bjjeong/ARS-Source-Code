/*global $, Address, ARS, Promise, moment */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.ServiceAppointmentService = (function () {
    "use strict";

    var config, servicesPromise;
    config = {};
    config.appointment = {};
    config.appointment.entityName = "ServiceAppointment";

    servicesPromise = null;

    function loadServicesAsync(dataRepository) {
        var options, type;

        if (servicesPromise === null) {
            type    = "Service";
            options = "&$select=Name,ServiceId";

            servicesPromise =
                dataRepository.loadMultipleRecordsAsync(type, options);
        }

        return servicesPromise;
    }

    function loadGeneralServiceAsync(dataRepository) {
        return loadServicesAsync(dataRepository).then(function (services) {
            var service;

            service = services.filter(function (obj) {
                return obj.Name === "General Service";
            })[0];

            if (!service) {
                service = services[0];
            }

            if (!service) {
                throw new Error("Could not load general service.");
            }

            return service;
        });
    }

    function getterFor(context, name) {
        return {
            get: function () {
                return context[name];
            }
        };
    }

    function Service(
        dataRepository,
        workOrderService,
        technicianService,
        geoLocationService,
        fetchXmlService
    ) {
        if (!dataRepository) {
            throw new Error("Missing parameter: dataRepository");
        }

        if (!workOrderService) {
            throw new Error("Missing parameter: workOrderService");
        }

        if (!technicianService) {
            throw new Error("Missing parameter: technicianService");
        }

        if (!geoLocationService) {
            throw new Error("Missing parameter: geoLocationService");
        }

        if (!fetchXmlService) {
            throw new Error("Missing parameter: fetchXmlService");
        }

        var instance = {};
        instance.dataRepository     = dataRepository;
        instance.geoLocationService = geoLocationService;
        instance.technicianService  = technicianService;
        instance.workOrderService   = workOrderService;
        instance.fetchXmlService    = fetchXmlService;

        Object.defineProperties(this, {
            dataRepository:     getterFor(instance, "dataRepository"),
            geoLocationService: getterFor(instance, "geoLocationService"),
            technicianService:  getterFor(instance, "technicianService"),
            workOrderService:   getterFor(instance, "workOrderService"),
            fetchXmlService:    getterFor(instance, "fetchXmlService")
        });
    }

    Service.prototype.getServiceAppointmentsAsync = function (filters) {
        var query = new ARS.Queries.ServiceAppointmentQuery();

        filters = filters || [];
        filters.forEach(function (filter) {
            var canApply =
                filter &&
                $.isFunction(filter.applyToServiceAppointmentQuery);

            if (canApply) {
                filter.applyToServiceAppointmentQuery(query);
            } else {
                throw new Error("Unexpected filter");
            }
        });

        return query.execute(this.fetchXmlService);
    };

    Service.prototype.createServiceAppointmentAsync =
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

            var record, recordType, repo;
            repo = this.dataRepository;

            userStart = moment(userStart).format("YYYY-MM-DD[T]HH:mm:ss");
            userEnd   = moment(userEnd).format("YYYY-MM-DD[T]HH:mm:ss");

            recordType = config.appointment.entityName;

            record                = {};
            record.ScheduledStart = userStart;
            record.ScheduledEnd   = userEnd;
            record.Subject        = workOrder.title;

            record.ars_Technician    = {};
            record.ars_Technician.Id = technician.technicianId;

            record.RegardingObjectId             = {};
            record.RegardingObjectId.Id          = workOrder.workOrderId;
            record.RegardingObjectId.LogicalName = "incident";

            record.ServiceId             = {};
            record.ServiceId.LogicalName = "service";

            return loadGeneralServiceAsync(repo).then(function (service) {
                record.ServiceId.Id = service.ServiceId;
                return repo.createRecordAsync(record, recordType);
            });
        };

    Service.prototype.updateServiceAppointmentAsync =
        function (appointmentId, userStart, userEnd) {
            if (!appointmentId) {
                throw new Error("Missing parameter: appointmentId");
            }

            if (!userStart && !userEnd) {
                throw new Error("Missing update parameters");
            }

            var entityName, obj;
            entityName = config.appointment.entityName;
            obj        = {};

            if (userStart) {
                obj.ScheduledStart =
                    moment(userStart).format("YYYY-MM-DD[T]HH:mm:ss");
            }

            if (userEnd) {
                obj.ScheduledEnd =
                    moment(userEnd).format("YYYY-MM-DD[T]HH:mm:ss");
            }

            return this.dataRepository
                .updateRecordAsync(appointmentId, obj, entityName);
        };

    Service.prototype.deleteServiceAppointmentAsync =
        function (appointmentId) {
            if (!appointmentId) {
                throw new Error("Missing parameter: appointmentId");
            }

            var type = config.appointment.entityName;

            return this.dataRepository.deleteRecordAsync(appointmentId, type);
        };

    Service.prototype.getServiceAppointmentsForTechnicianAsync =
        function (tech, utcTime) {
            var query = new ARS.Queries.ServiceAppointmentQuery();
            query.addTechnician(tech);
            query.endsAfter    = utcTime;
            query.startsBefore = utcTime;
            return query.execute(this.fetchXmlService);
        };

    Service.prototype.getTechnicianCoordinatesAsync =
        function (tech, utcTime) {
            return this
                .getServiceAppointmentsForTechnicianAsync(tech, utcTime)
                .then(function (appointments) {
                    var result, source;

                    source = appointments && appointments[0] ?
                            appointments[0] :
                            tech;

                    result                  = {};
                    result.addressComposite = source.addressComposite;
                    result.latLng           = source.latLng;

                    return result;
                });
        };

    Service.prototype.getTechnicianDistanceAsync =
        function (tech, utcTime, to) {
            var geo;

            if (to instanceof ARS.Models.LatLng === false) {
                throw new TypeError("Expecting ARS.Models.LatLng");
            }

            geo = this.geoLocationService;

            return this
                .getTechnicianCoordinatesAsync(tech, utcTime)
                .then(function (location) {
                    var from = location ? location.latLng : null;

                    if (from instanceof ARS.Models.LatLng) {
                        return geo.getDrivingDistanceAsync(from, to);
                    }

                    return Infinity; // I can see the universe.
                });
        };

    return Service;
}());
