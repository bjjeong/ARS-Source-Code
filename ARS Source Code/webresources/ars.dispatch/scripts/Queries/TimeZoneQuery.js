/*global Promise */

var ARS;
ARS = ARS || {};
ARS.Queries = ARS.Queries || {};
ARS.Queries.TimeZoneQuery = (function () {
    "use strict";

    var templates = {};

    templates.timeZoneSingleFilter =
        "<condition" +
        "    attribute=\"standardname\"" +
        "    operator=\"eq\"" +
        "    value=\"{standardName}\" />";

    templates.standardNameValues = "<value>{standardName}</value>";

    templates.timeZoneMultiFilter =
        "<condition" +
        "    attribute=\"standardname\"" +
        "    operator=\"in\">" +
        "    {standardNameValues}" +
        "</condition>";

    templates.timeZoneDefinitionFilters = "<filter>{timeZoneFilter}</filter>";

    templates.fetchXml =
        "<fetch" +
        "    version=\"1.0\"" +
        "    output-format=\"xml-platform\"" +
        "    mapping=\"logical\">" +
        "    <entity name=\"timezonedefinition\">" +
        "        <attribute name=\"userinterfacename\" />" +
        "        <attribute name=\"timezonecode\" />" +
        "        <attribute name=\"standardname\" />" +
        "        {timeZoneDefinitionFilters}" +
        "    </entity>" +
        "</fetch>";

    function getSingleTimeZoneFilter(zone) {
        var parts = {};
        parts.standardName = ARS.Util.xmlEncode(zone);
        return parts.standardName ?
            templates.timeZoneSingleFilter.supplant(parts) : "";
    }

    function getMultiTimeZoneFilter(zones) {
        var parts = {};

        parts.standardNameValues = zones.map(function (zone) {
            var part = {};
            part.standardName = ARS.Util.xmlEncode(zone);
            return part.standardName ?
                templates.standardNameValues.supplant(part) : "";
        }).filter(Boolean).join("\n");

        return parts.standardNameValues ?
            templates.timeZoneMultiFilter.supplant(parts) : "";
    }

    function getTimeZoneDefinitionFilters(query) {
        var parts, zones;
        parts = {};

        zones = query.zones.filter(function (zone) {
            return ARS.Models.TimeZone.getCachedValue(zone) === null;
        });

        parts.timeZoneFilter = zones.length === 1 ?
            getSingleTimeZoneFilter(zones[0]) :
            getMultiTimeZoneFilter(zones);

        return parts.timeZoneFilter ? 
            templates.timeZoneDefinitionFilters.supplant(parts) : "";
    }

    function TimeZoneQuery() {
        var instance = {};
        instance.zones = [];

        Object.defineProperties(this, {
            zones: {
                get: function () {
                    return instance.zones.slice(0);
                }
            }
        });

        this.addZone = function (zone) {
            if (zone && instance.zones.indexOf(zone) === -1) {
                instance.zones.push(zone);
            }
        };

        this.clear = function () {
            instance.zones.length = 0;
        };
    }

    TimeZoneQuery.prototype.generateFetchXml = function () {
        var parts = {};
        parts.timeZoneDefinitionFilters = getTimeZoneDefinitionFilters(this);
        return parts.timeZoneDefinitionFilters ?
            templates.fetchXml.supplant(parts) : "";
    };

    TimeZoneQuery.prototype.execute = function (fetchXmlService) {
        var timeZones, xml;

        timeZones = this.zones.reduce(function (prev, next) {
            prev[next] = ARS.Models.TimeZone.getCachedValue(next);
            return prev;
        }, {});

        xml = this.generateFetchXml();

        if (!xml) {
            return Promise.resolve(timeZones);
        }

        return fetchXmlService
            .retrieveMultiple(xml)
            .then(function (response) {
                response.entities.forEach(function (entity) {
                    var name, code, ui;
                    name = entity.standardname;
                    code = entity.timezonecode;
                    ui   = entity.userinterfacename;

                    timeZones[name] = ARS.Models.TimeZone
                        .getOrCreate(name, ui, code);
                });

                return timeZones;
            });
    };

    return TimeZoneQuery;
}());
