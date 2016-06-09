var ARS;
ARS = ARS || {};
ARS.Queries = ARS.Queries || {};
ARS.Queries.DurationQuery = (function () {
    "use strict";

    var templates;

    templates = {};

    templates.fetchXml =
        "<fetch" +
        "  version=\"1.0\"" +
        "  output-format=\"xml-platform\"" +
        "  mapping=\"logical\"" +
        "  aggregate=\"true\">" +
        "  <entity name=\"ars_servicecode\">" +
        "    <attribute" +
        "      name=\"ars_estimatedhours\"" +
        "      aggregate=\"sum\"" +
        "      alias=\"totalHours\" />" +
        "    <link-entity" +
        "      name=\"ars_incident_ars_servicecode\"" +
        "      from=\"ars_servicecodeid\"" +
        "      to=\"ars_servicecodeid\"" +
        "      visible=\"false\"" +
        "      intersect=\"true\">" +
        "      <filter>" +
        "        <condition" +
        "          attribute=\"incidentid\"" +
        "          operator=\"eq\"" +
        "          value=\"{workOrderId}\" />" +
        "      </filter>" +
        "    </link-entity>" +
        "  </entity>" +
        "</fetch>";

    function getterFor(context, name) {
        return function () {
            return context[name];
        };
    }

    function DurationQuery(workOrderId) {
        var instance = {};
        instance.workOrderId = workOrderId;

        Object.defineProperties(this, {
            workOrderId: {
                get: getterFor(instance, "workOrderId")
            }
        });
    }

    DurationQuery.prototype.generateFetchXml = function () {
        var parts;
        parts = {};
        parts.workOrderId = "{" + this.workOrderId + "}";
        return templates.fetchXml.supplant(parts);
    };

    return DurationQuery;
}());
