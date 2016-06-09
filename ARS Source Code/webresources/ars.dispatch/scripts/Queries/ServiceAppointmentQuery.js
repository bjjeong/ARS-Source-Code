/*global moment */

var ARS;
ARS = ARS || {};
ARS.Queries = ARS.Queries || {};
ARS.Queries.ServiceAppointmentQuery = (function () {
    "use strict";

    var templates;

    function getterFor(context, name) {
        return function () {
            return context[name];
        };
    }

    function stringValueFor(context, name) {
        return {
            get: getterFor(context, name),
            set: function (value) {
                context[name] = String(value || "").trim();
            }
        };
    }

    function extractTimeZonesByPath(response, path) {
        return response.entities.filter(function (entity) {
            return entity && entity[path] && entity[path].label;
        }).map(function (entity) {
            return entity[path].label;
        });
    }

    function extractLocationTimeZones(response) {
        return extractTimeZonesByPath(response, "location.ars_timezone");
    }

    function extractTechnicianTimeZones(response) {
        return extractTimeZonesByPath(response, "technician.ars_timezone");
    }

    function extractTimeZones(response) {
        return extractLocationTimeZones(response)
            .concat(extractTechnicianTimeZones(response))
            .distinct();
    }

    templates = {};

    templates.startsBeforeFilter =
        "<condition" +
        "  attribute=\"scheduledstart\"" +
        "  operator=\"lt\"" +
        "  value=\"{startsBefore}\" />";

    templates.endsAfterFilter =
        "<condition" +
        "  attribute=\"scheduledend\"" +
        "  operator=\"gt\"" +
        "  value=\"{endsAfter}\" />";

    templates.singleTechnicianFilter =
        "<condition" +
        "  attribute=\"ars_technician\"" +
        "  operator=\"eq\"" +
        "  value=\"{technicianId}\" />";

    templates.technicians = "<value>{technicianId}</value>";

    templates.multipleTechnicianFilter =
        "<condition attribute=\"ars_technician\" operator=\"in\">" +
        "    {technicians}" +
        "</condition>";

    templates.serviceAppointmentFilters =
        "<filter>" +
        "  {endsAfterFilter}" +
        "  {startsBeforeFilter}" +
        "  {technicianFilter}" +
        "</filter>";

    templates.fetchXml =
        "<fetch" +
        "  version=\"1.0\"" +
        "  output-format=\"xml-platform\"" +
        "  mapping=\"logical\" distinct=\"true\">" +
        "  <entity name=\"serviceappointment\">" +
        "    <attribute name=\"scheduledstart\" usertimezone=\"false\" />" +
        "    <attribute name=\"scheduledend\" usertimezone=\"false\" />" +
        "    <attribute name=\"activityid\" />" +
        "    <attribute name=\"regardingobjectid\" />" +
        "    {serviceAppointmentFilters}" +
        "    <link-entity" +
        "      name=\"ars_technician\"" +
        "      from=\"ars_technicianid\"" +
        "      to=\"ars_technician\"" +
        "      alias=\"technician\">" +
        "      <attribute name=\"ars_name\" />" +
        "      <attribute name=\"ars_technicianid\" />" +
        "      <attribute name=\"ars_latitude\" />" +
        "      <attribute name=\"ars_longitude\" />" +
        "      <attribute name=\"ars_stateprovince\" />" +
        "      <attribute name=\"ars_city\" />" +
        "      <attribute name=\"ars_streetaddress1\" />" +
        "      <attribute name=\"ars_zipcode\" />" +
        "      <attribute name=\"ars_timezone\" />" +
        "    </link-entity>" +
        "    <link-entity" +
        "      name=\"incident\"" +
        "      from=\"incidentid\"" +
        "      to=\"regardingobjectid\"" +
        "      alias=\"workOrder\">" +
        "      <attribute name=\"ticketnumber\" />" +
        "      <attribute name=\"incidentid\" />" +
        "      <attribute name=\"title\" />" +
        "      <attribute name=\"ars_emergencyovertimerequest\" />" +
        "      <attribute" +
        "        name=\"ars_completebydate\"" +
        "        usertimezone=\"false\" />" +
        "      <attribute name=\"statuscode\" />" +
        "      <attribute name=\"ars_schedulingcomplete\" />" +
        "      <link-entity" +
        "        name=\"account\"" +
        "        from=\"accountid\"" +
        "        to=\"customerid\"" +
        "        alias=\"account\">" +
        "        <attribute name=\"name\" />" +
        "      </link-entity>" +
        "      <link-entity" +
        "        name=\"account\"" +
        "        from=\"accountid\"" +
        "        to=\"ars_location\"" +
        "        alias=\"location\">" +
        "        <attribute name=\"name\" />" +
        "        <attribute name=\"address1_longitude\" />" +
        "        <attribute name=\"address1_latitude\" />" +
        "        <attribute name=\"address1_composite\" />" +
        "        <attribute name=\"ars_timezone\" />" +
        "      </link-entity>" +
        "    </link-entity>" +
        "  </entity>" +
        "</fetch>";

    function mapLatLng(entity, prefix) {
        var lat, lng;
        lat = entity[prefix + "latitude"];
        lng = entity[prefix + "longitude"];
        return ARS.Models.LatLng.tryCreate(lat, lng);
    }

    function mapTimeZone(entity, path, timeZones) {
        var timeZone = entity[path];
        timeZone = timeZone ? timeZone.label : null;
        return timeZones[timeZone] || null;
    }

    function mapUtcDate(date) {
        return moment.utc(date).format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    }

    function mapWorkOrder(entity, timeZones) {
        var status, timeZone, workOrder;

        timeZone = mapTimeZone(entity, "location.ars_timezone", timeZones);

        status = entity["workOrder.statuscode"];
        status = status ? status.label : null;

        workOrder                  = new ARS.Models.WorkOrderModel();
        workOrder.workOrderId      = entity["workOrder.incidentid"];
        workOrder.addressComposite = entity["location.address1_composite"];
        workOrder.locationName     = entity["location.name"];
        workOrder.completeByDate   = entity["workOrder.ars_completebydate"];

        workOrder.isEmergency =
            entity["workOrder.ars_emergencyovertimerequest"];

        workOrder.latLng = mapLatLng(entity, "location.address1_");

        workOrder.schedulingComplete =
            entity["workOrder.ars_schedulingcomplete"];

        workOrder.status       = status;
        workOrder.ticketNumber = entity["workOrder.ticketnumber"];
        workOrder.timeZone     = timeZone;
        workOrder.title        = entity["workOrder.title"];

        return workOrder;
    }

    function mapTechnician(entity, timeZones) {
        var state, technician, tz;

        state = entity["technician.ars_stateprovince"];
        state = state ? state.label : null;

        tz = mapTimeZone(entity, "technician.ars_timezone", timeZones);

        technician              = new ARS.Models.Technician();
        technician.technicianId = entity["technician.ars_technicianid"];
        technician.city         = entity["technician.ars_city"];
        technician.latLng       = mapLatLng(entity, "technician.ars_");
        technician.name         = entity["technician.ars_name"];
        technician.state        = state;
        technician.street       = entity["technician.ars_streetaddress1"];
        technician.timeZone     = tz;
        technician.zip          = entity["technician.ars_zipcode"];

        return technician;
    }

    function mapToModel(entity, timeZones) {
        var appointment           = new ARS.Models.ServiceAppointment();
        appointment.utcStart      = mapUtcDate(entity.scheduledstart);
        appointment.utcEnd        = mapUtcDate(entity.scheduledend);
        appointment.appointmentId = entity.activityid;
        appointment.workOrder     = mapWorkOrder(entity, timeZones);
        appointment.technician    = mapTechnician(entity, timeZones);
        return appointment;
    }

    function getEndsAfterFilter(query) {
        var parts = {};
        parts.endsAfter = ARS.Util.xmlEncode(query.endsAfter);
        return parts.endsAfter ?
            templates.endsAfterFilter.supplant(parts) : "";
    }

    function getStartsBeforeFilter(query) {
        var parts = {};
        parts.startsBefore = ARS.Util.xmlEncode(query.startsBefore);
        return parts.startsBefore ?
            templates.startsBeforeFilter.supplant(parts) : "";
    }

    function encodeGuid(guid) {
        return ARS.Util.xmlEncode("{" + guid + "}");
    }

    function getTechnicianFilter(query) {
        var parts, techs;

        parts = {};
        techs = query.technicians;

        if (techs.length === 0) {
            return "";
        }

        if (techs.length === 1) {
            parts.technicianId = encodeGuid(techs[0].technicianId);
            return templates.singleTechnicianFilter.supplant(parts);
        }

        parts.technicians = techs.map(function (tech) {
            var part = {};
            part.technicianId = encodeGuid(tech.technicianId);
            return templates.technicians.supplant(part);
        }).join("\n");

        return templates.multipleTechnicianFilter.supplant(parts);
    }

    function getServiceAppointmentFilters(query) {
        var hasValue, parts;

        parts                    = {};
        parts.endsAfterFilter    = getEndsAfterFilter(query);
        parts.startsBeforeFilter = getStartsBeforeFilter(query);
        parts.technicianFilter   = getTechnicianFilter(query);

        hasValue =
            parts.endsAfterFilter ||
            parts.startsBeforeFilter ||
            parts.technicianFilter;

        return hasValue ?
            templates.serviceAppointmentFilters.supplant(parts) : "";
    }

    function ServiceAppointmentQuery() {
        var instance = {};
        instance.technicians = [];

        Object.defineProperties(this, {
            endsAfter: stringValueFor(instance, "endsAfter"),
            startsBefore: stringValueFor(instance, "startsBefore"),
            technicians: {
                get: function () {
                    return instance.technicians.slice(0);
                }
            }
        });

        this.clearTechnicians = function () {
            instance.technicians.length = 0;
        };

        this.addTechnician = function (technician) {
            var isValid =
                technician instanceof ARS.Models.Technician &&
                !instance.technicians.first(technician.equals, technician);

            if (isValid) {
                instance.technicians.push(technician);
            }
        };

        this.clear();
    }

    ServiceAppointmentQuery.prototype.clear = function () {
        this.endsAfter    = null;
        this.startsBefore = null;
        this.clearTechnicians();
    };

    ServiceAppointmentQuery.prototype.generateFetchXml = function () {
        var parts;
        parts = {};
        parts.serviceAppointmentFilters = getServiceAppointmentFilters(this);
        return templates.fetchXml.supplant(parts);
    };

    ServiceAppointmentQuery.prototype.execute = function (fetchXmlService) {
        return fetchXmlService
            .retrieveMultiple(this.generateFetchXml())
            .then(function (response) {
                var query = new ARS.Queries.TimeZoneQuery();

                extractTimeZones(response).forEach(query.addZone, query);

                return query
                    .execute(fetchXmlService)
                    .then(function (timeZones) {
                        return response.entities.map(function (entity) {
                            return mapToModel(entity, timeZones);
                        });
                    });
            });
    };

    return ServiceAppointmentQuery;
}());
