var ARS;
ARS = ARS || {};
ARS.Queries = ARS.Queries || {};
ARS.Queries.WorkOrderQuery = (function () {
    "use strict";

    var templates;

    function sortNumeric(a, b) {
        if (a < b) {
            return -1;
        }

        if (a > b) {
            return 1;
        }

        return 0;
    }

    function mapModel(entity, timeZones) {
        var lat, lon, model, status, tz;

        lat = entity["account.address1_latitude"];
        lon = entity["account.address1_longitude"];

        tz =
            entity &&
            entity["account.ars_TimeZone"] &&
            entity["account.ars_TimeZone"].label &&
            timeZones.hasOwnProperty(entity["account.ars_TimeZone"].label) &&
            timeZones[entity["account.ars_TimeZone"].label];

        tz = tz ? timeZones[entity["account.ars_TimeZone"].label] : null;

        status = entity.statuscode ? entity.statuscode.label : null;

        model                    = new ARS.Models.WorkOrderModel();
        model.workOrderId        = entity.incidentid;
        model.addressComposite   = entity["account.address1_composite"];
        model.locationName       = entity["account.name"];
        model.completeByDate     = entity.ars_completebydate;
        model.isEmergency        = entity.ars_emergencyovertimerequest;
        model.latLng             = ARS.Models.LatLng.tryCreate(lat, lon);
        model.schedulingComplete = entity.ars_schedulingcomplete;
        model.status             = status;
        model.ticketNumber       = entity.ticketnumber;
        model.timeZone           = tz;
        model.title              = entity.title;

        return model;
    }

    function mapToModel(response, timeZones) {
        var model;
        model              = {};
        model.pagingCookie = response.pagingCookie;
        model.moreRecords  = response.moreRecords;
        model.workOrders   = response.entities.map(function (entity) {
            return mapModel(entity, timeZones);
        });

        return model;
    }

    templates = {};

    templates.userFilter =
        "<condition attribute=\"ownerid\" operator=\"eq-userid\" />";

    templates.ticketFilter =
        "<condition" +
        "    attribute=\"ticketnumber\"" +
        "    operator=\"like\"" +
        "    value=\"%{value}%\" />";

    templates.singleStatusCodeFilter =
        "<condition" +
        "    attribute=\"statuscode\"" +
        "    operator=\"eq\"" +
        "    value=\"{value}\" />";

    templates.statusCodeValues = "<value>{value}</value>";

    templates.multiStatusCodesFilter =
        "<condition attribute=\"statuscode\" operator=\"in\">" +
        "    {statusCodeValues}" +
        "</condition>";

    templates.workOrderIdFilter =
        "<condition" +
        "    attribute=\"incidentid\"" +
        "    operator=\"eq\"" +
        "    value=\"{workOrderId}\" />";

    templates.schedulingCompletedFilter =
        "<condition" +
        "    attribute=\"ars_schedulingcomplete\"" +
        "    operator=\"neq\"" +
        "    value=\"1\" />";

    templates.incidentFilters =
        "<filter type=\"and\">" +
        "    {statusCodeFilter}" +
        "    {schedulingCompletedFilter}" +
        "    {userFilter}" +
        "    {ticketFilter}" +
        "    {workOrderIdFilter}" +
        "</filter>";

    templates.locationFilter =
        "<condition" +
        "    attribute=\"ars_region\"" +
        "    operator=\"eq\"" +
        "    uiname=\"{regionName}\"" +
        "    uitype=\"ars_region\"" +
        "    value=\"{regionId}\" />";

    templates.locationFilters = "<filter type=\"or\">{locations}</filter>";

    templates.fetchXml =
        "<fetch" +
        "    version=\"1.0\"" +
        "    output-format=\"xml-platform\"" +
        "    mapping=\"logical\"" +
        "    {paging}" +
        "    distinct=\"true\">" +
        "    <entity name=\"incident\">" +
        "        <attribute name=\"ticketnumber\" />" +
        "        <attribute name=\"incidentid\" />" +
        "        <attribute name=\"title\" />" +
        "        <attribute name=\"ars_emergencyovertimerequest\" />" +
        "        <attribute name=\"ars_completebydate\" />" +
        "        <attribute name=\"statuscode\" />" +
        "        <attribute name=\"ars_schedulingcomplete\" />" +
        "        {incidentFilters}" +
        "        <order attribute=\"ticketnumber\" />" +
        "        <link-entity" +
        "            name=\"account\"" +
        "            from=\"accountid\"" +
        "            to=\"ars_location\"" +
        "            alias=\"account\">" +
        "            <attribute name=\"address1_longitude\" />" +
        "            <attribute name=\"name\" />" +
        "            <attribute name=\"address1_latitude\" />" +
        "            <attribute name=\"address1_composite\" />" +
        "            <attribute name=\"ars_timezone\" />" +
        "            {locationFilters}" +
        "        </link-entity>" +
        "    </entity>" +
        "</fetch>";

    function getUserFilter(workOrderQuery) {
        if (workOrderQuery.allUsers === true) {
            return "";
        }

        return templates.userFilter;
    }

    function getStatusFilter(workOrderQuery) {
        var parts;

        if (workOrderQuery.statusCodes.length === 0) {
            return "";
        }

        parts = {};
        if (workOrderQuery.statusCodes.length === 1) {
            parts.value = workOrderQuery.statusCodes[0];
            return templates.singleStatusCodeFilter.supplant(parts);
        }

        parts.statusCodeValues = workOrderQuery.statusCodes
            .distinct()
            .sort(sortNumeric)
            .map(function (code) {
                return templates.statusCodeValues.supplant({ value: code });
            })
            .join("\n");

        return templates.multiStatusCodesFilter.supplant(parts);
    }

    function getTicketFilter(workOrderQuery) {
        var parts;

        parts = {};
        parts.value = workOrderQuery.ticket;

        if (!parts.value) {
            return "";
        }

        parts.value = ARS.Util.likeEncode(parts.value);
        parts.value = ARS.Util.xmlEncode(parts.value);
        return templates.ticketFilter.supplant(parts);
    }

    function getWorkOrderIdFilter(workOrderQuery) {
        var parts;

        parts = {};
        parts.workOrderId = workOrderQuery.workOrderId;

        if (!parts.workOrderId) {
            return "";
        }

        parts.workOrderId = "{" + parts.workOrderId + "}";
        parts.workOrderId = ARS.Util.xmlEncode(parts.workOrderId);
        return templates.workOrderIdFilter.supplant(parts);
    }

    function getSchedulingCompletedFilter(workOrderQuery) {
        var filter = workOrderQuery.includeCompletedSchedules;
        return filter === false ? templates.schedulingCompletedFilter : "";
    }

    function getIncidentFilters(workOrderQuery) {
        var parts, hasValue;

        parts                   = {};
        parts.statusCodeFilter  = getStatusFilter(workOrderQuery);
        parts.userFilter        = getUserFilter(workOrderQuery);
        parts.ticketFilter      = getTicketFilter(workOrderQuery);
        parts.workOrderIdFilter = getWorkOrderIdFilter(workOrderQuery);

        parts.schedulingCompletedFilter =
            getSchedulingCompletedFilter(workOrderQuery);

        hasValue =
            parts.schedulingCompletedFilter ||
            parts.statusCodeFilter ||
            parts.userFilter ||
            parts.ticketFilter ||
            parts.workOrderIdFilter;

        return hasValue ? templates.incidentFilters.supplant(parts) : "";
    }

    function getLocationFilter(region) {
        var parts = {};
        parts.regionName = ARS.Util.xmlEncode(region.regionName);
        parts.regionId = "{" + region.regionId + "}";
        parts.regionId = ARS.Util.xmlEncode(parts.regionId);
        return templates.locationFilter.supplant(parts);
    }

    function getLocationFilters(workOrderQuery) {
        var parts;

        if (workOrderQuery.regions.length === 0) {
            return "";
        }

        parts = {};
        parts.locations = workOrderQuery.regions
            .map(getLocationFilter)
            .join("\n");

        return templates.locationFilters.supplant(parts);
    }

    function getPagingAttributes(workOrderQuery) {
        var attrs, cookie;
        attrs = [];
        cookie = workOrderQuery.pagingCookie;

        if (cookie && workOrderQuery.page > 1) {
            cookie = ARS.Util.xmlEncode(cookie);
            cookie = "paging-cookie=\"" + cookie + "\"";
            attrs.push(cookie);

            attrs.push("page=\"" + workOrderQuery.page.toString() + "\"");
        }

        if (workOrderQuery.perPage < 5000) {
            attrs.push("count=\"" + workOrderQuery.perPage.toString() + "\"");
        }

        return attrs.join(" ");
    }

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

    function WorkOrderQuery() {
        var instance = {};

        instance.allUsers           = false;
        instance.page               = 1;
        instance.pagingCookie       = "";
        instance.perPage            = 20;
        instance.regions            = [];
        instance.schedulingComplete = null;
        instance.statusCodes        = [];
        instance.ticket             = "";
        instance.workOrderId        = "";

        Object.defineProperties(this, {
            allUsers: {
                get: getterFor(instance, "allUsers"),
                set: function (value) {
                    instance.allUsers = Boolean(value);
                }
            },

            page: {
                get: getterFor(instance, "page"),
                set: function (value) {
                    var parsed = parseInt(value, 10);
                    if (isNaN(parsed)) {
                        parsed = 1;
                    }

                    if (isFinite(parsed) === false) {
                        parsed = 1;
                    }

                    if (parsed < 1) {
                        parsed = 1;
                    }

                    instance.page = parsed;
                }
            },

            pagingCookie: stringValueFor(instance, "pagingCookie"),

            perPage: {
                get: getterFor(instance, "perPage"),
                set: function (value) {
                    var parsed = parseInt(value, 10);
                    if (isNaN(parsed)) {
                        parsed = 20;
                    }

                    if (isFinite(parsed) === false) {
                        parsed = 20;
                    }

                    if (parsed < 1) {
                        parsed = 1;
                    }

                    if (parsed > 5000) {
                        parsed = 5000;
                    }

                    instance.perPage = parsed;
                }
            },

            regions: {
                get: function () {
                    return instance.regions.slice(0);
                }
            },

            schedulingComplete: {
                get: getterFor(instance, "schedulingComplete"),
                set: function (value) {
                    if (value === null || value === undefined) {
                        instance.schedulingComplete = null;
                    } else {
                        instance.schedulingComplete = Boolean(value);
                    }
                }
            },

            statusCodes: {
                get: function () {
                    return instance.statusCodes.slice(0);
                }
            },

            ticket: stringValueFor(instance, "ticket"),

            workOrderId: stringValueFor(instance, "workOrderId")
        });

        this.addRegion = function (regionId, regionName) {
            var region = {};
            region.regionId = regionId;
            region.regionName = regionName;
            instance.regions.push(region);
        };

        this.clearRegions = function () {
            instance.regions.length = 0;
        };

        this.addStatusCode = function (code) {
            instance.statusCodes.push(code);
        };

        this.clearStatusCodes = function () {
            instance.statusCodes.length = 0;
        };
    }

    WorkOrderQuery.prototype.reset = function () {
        this.allUsers           = false;
        this.page               = 1;
        this.perPage            = 20;
        this.pagingCookie       = "";
        this.schedulingComplete = null;
        this.ticket             = "";
        this.workOrderId        = "";
        this.clearRegions();
        this.clearStatusCodes();
    };

    WorkOrderQuery.prototype.generateFetchXml = function () {
        var parts;
        parts = {};
        parts.incidentFilters = getIncidentFilters(this);
        parts.locationFilters = getLocationFilters(this);
        parts.paging = getPagingAttributes(this);
        return templates.fetchXml.supplant(parts);
    };

    WorkOrderQuery.prototype.execute = function (fetchXmlService) {
        return fetchXmlService
            .retrieveMultiple(this.generateFetchXml())
            .then(function (response) {
                var query = new ARS.Queries.TimeZoneQuery();

                response.entities
                    .map(function (entity) {
                        return entity["account.ars_TimeZone"];
                    })
                    .filter(Boolean)
                    .pluck("label")
                    .filter(Boolean)
                    .distinct()
                    .forEach(query.addZone, query);

                return query
                    .execute(fetchXmlService)
                    .then(function (timeZones) {
                        return mapToModel(response, timeZones);
                    });
            });
    };

    return WorkOrderQuery;
}());
