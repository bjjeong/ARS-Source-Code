var ARS;
ARS = ARS || {};
ARS.Queries = ARS.Queries || {};
ARS.Queries.CurrentUserTimeZoneQuery = (function () {
    "use strict";

    var templates = {};

    templates.fetchXml =
        "<fetch" +
        "    version=\"1.0\"" +
        "    output-format=\"xml-platform\"" +
        "    mapping=\"logical\"" +
        "    count=\"1\"" +
        "    distinct=\"true\">" +
        "    <entity name=\"timezonedefinition\">" +
        "        <attribute name=\"timezonecode\" alias=\"code\" />" +
        "        <attribute name=\"standardname\" alias=\"standardName\" />" +
        "        <attribute" +
        "            name=\"userinterfacename\"" +
        "            alias=\"userInterfaceName\" />" +
        "        <link-entity" +
        "            name=\"usersettings\"" +
        "            from=\"timezonecode\"" +
        "            to=\"timezonecode\"" +
        "            visible=\"false\">" +
        "            <filter>" +
        "                <condition" +
        "                    attribute=\"systemuserid\"" +
        "                    operator=\"eq-userid\" />" +
        "            </filter>" +
        "        </link-entity>" +
        "    </entity>" +
        "</fetch>";

    function mapResponse(response) {
        var entity;
        entity = response.entities.first();

        if (entity) {
            return ARS.Models.TimeZone.getOrCreate(
                entity.standardName,
                entity.userInterfaceName,
                entity.code
            );
        }

        return null;
    }

    function CurrentUserTimeZoneQuery() {
        return undefined;
    }

    CurrentUserTimeZoneQuery.prototype.generateFetchXml = function () {
        return templates.fetchXml;
    };

    CurrentUserTimeZoneQuery.prototype.execute = function (fetchXmlService) {
        return fetchXmlService
            .retrieveMultiple(this.generateFetchXml())
            .then(mapResponse);
    };

    return CurrentUserTimeZoneQuery;
}());
