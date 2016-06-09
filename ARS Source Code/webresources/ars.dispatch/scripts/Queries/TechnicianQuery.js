var ARS;
ARS = ARS || {};
ARS.Queries = ARS.Queries || {};
ARS.Queries.TechnicianQuery = (function () {
    "use strict";

    var templates;

    templates = {};

    templates.regionFilter =
        "<condition" +
        "    attribute=\"ars_region\"" +
        "    operator=\"eq\"" +
        "    uiname=\"{regionName}\"" +
        "    uitype=\"ars_region\"" +
        "    value=\"{regionId}\" />";

    templates.regionFilters = "<filter type=\"or\">{regions}</filter>";

    templates.technicianIdFilter =
        "<condition" +
        "    attribute=\"ars_technicianid\"" +
        "    operator=\"eq\"" +
        "    value=\"{technicianId}\" />";

    templates.technicianFilters =
        "<filter type=\"and\">" +
        "    {regionFilters}" +
        "    {technicianIdFilter}" +
        "</filter>";

    templates.fetchXml =
        "<fetch" +
        "    version=\"1.0\"" +
        "    output-format=\"xml-platform\"" +
        "    mapping=\"logical\"" +
        "    distinct=\"true\">" +
        "    <entity name=\"ars_technician\">" +
        "        <attribute name=\"ars_name\" />" +
        "        <attribute name=\"ars_technicianid\" />" +
        "        <attribute name=\"ars_latitude\" />" +
        "        <attribute name=\"ars_longitude\" />" +
        "        <attribute name=\"ars_stateprovince\" />" +
        "        <attribute name=\"ars_city\" />" +
        "        <attribute name=\"ars_streetaddress1\" />" +
        "        <attribute name=\"ars_zipcode\" />" +
        "        <attribute name=\"ars_timezone\" />" +
        "        <order attribute=\"ars_name\" />" +
        "        {technicianFilters}" +
        "    </entity>" +
        "</fetch>";

    function getRegionFilter(region) {
        var parts = {};
        parts.regionName = ARS.Util.xmlEncode(region.regionName);
        parts.regionId = "{" + region.regionId + "}";
        parts.regionId = ARS.Util.xmlEncode(parts.regionId);
        return templates.regionFilter.supplant(parts);
    }

    function getRegionFilters(query) {
        var parts = {};
        parts.regions = query.regions.map(getRegionFilter).join("\n");
        return parts.regions ? templates.regionFilters.supplant(parts) : "";
    }

    function getTechnicianIdFilter(query) {
        var parts = {};

        if (query.technicianId) {
            parts.technicianId = "{" + query.technicianId + "}";
            parts.technicianId = ARS.Util.xmlEncode(parts.technicianId);
            return templates.technicianIdFilter.supplant(parts);
        }

        return "";
    }

    function getTechnicianFilters(query) {
        var hasValue, parts;
        parts = {};
        parts.regionFilters = getRegionFilters(query);
        parts.technicianIdFilter = getTechnicianIdFilter(query);

        hasValue = parts.regionFilters || parts.technicianIdFilter;

        return hasValue ? templates.technicianFilters.supplant(parts) : "";
    }

    function mapToModel(entity, timeZones) {
        var lat, lon, model, state, tz;

        lat = entity.ars_latitude;
        lon = entity.ars_longitude;

        state = entity.ars_stateprovince;
        state = state ? state.label : null;

        tz =
            entity &&
            entity.ars_timezone &&
            entity.ars_timezone.label &&
            timeZones.hasOwnProperty(entity.ars_timezone.label) &&
            timeZones[entity.ars_timezone.label];

        tz = tz ? timeZones[entity.ars_timezone.label] : null;

        model              = new ARS.Models.Technician();
        model.technicianId = entity.ars_technicianid;
        model.city         = entity.ars_city;
        model.latLng       = ARS.Models.LatLng.tryCreate(lat, lon);
        model.name         = entity.ars_name;
        model.state        = state;
        model.street       = entity.ars_streetaddress1;
        model.timeZone     = tz;
        model.zip          = entity.ars_zipcode;

        return model;
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

    function TechnicianQuery() {
        var instance = {};
        instance.regions      = [];
        instance.technicianId = "";

        Object.defineProperties(this, {
            regions: {
                get: function () {
                    return instance.regions.slice(0);
                }
            },
            technicianId: stringValueFor(instance, "technicianId")
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
    }

    TechnicianQuery.prototype.reset = function () {
        this.technicianId = null;
        this.clearRegions();
    };

    TechnicianQuery.prototype.generateFetchXml = function () {
        var parts = {};
        parts.technicianFilters = getTechnicianFilters(this);
        return templates.fetchXml.supplant(parts);
    };

    TechnicianQuery.prototype.execute = function (fetchXmlService) {
        return fetchXmlService
            .retrieveMultiple(this.generateFetchXml())
            .then(function (response) {
                var query = new ARS.Queries.TimeZoneQuery();

                response.entities
                    .pluck("ars_timezone")
                    .filter(Boolean)
                    .pluck("label")
                    .filter(Boolean)
                    .distinct()
                    .forEach(query.addZone, query);

                return query
                    .execute(fetchXmlService)
                    .then(function (timeZones) {
                        return response.entities.map(function (entity) {
                            return mapToModel(entity, timeZones);
                        });
                    });
            });
    };

    return TechnicianQuery;
}());
