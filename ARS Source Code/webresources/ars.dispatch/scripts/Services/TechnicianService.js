/*global $, ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.TechnicianService = (function () {
    "use strict";

    var config;
    config = {};
    config.cache = {};

    function addTechToCache(tech) {
        var key = tech.technicianId;
        if (config.cache.hasOwnProperty(key) === false) {
            config.cache[key] = Promise.resolve(tech);
        }

        return tech;
    }

    function addTechsToCache(techs) {
        techs.forEach(addTechToCache);
        return techs;
    }

    function TechnicianService(fetchXmlService) {
        if (!fetchXmlService) {
            throw new Error("Missing parameter: fetchXmlService");
        }

        Object.defineProperties(this, {
            fetchXmlService: {
                get: function () {
                    return fetchXmlService;
                }
            }
        });
    }

    TechnicianService.prototype.getTechniciansAsync = function (filters) {
        var query = new ARS.Queries.TechnicianQuery();

        filters = filters || [];

        filters.forEach(function (filter) {
            if (filter && $.isFunction(filter.applyToTechnicianQuery)) {
                filter.applyToTechnicianQuery(query);
            }
        });

        return query
            .execute(this.fetchXmlService)
            .then(addTechsToCache);
    };

    return TechnicianService;
}());
