/*global $, ARS, Promise, window */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.GeoLocationService = (function () {
    "use strict";
    /*jslint unparam: true */

    var drivingDistanceCache;
    drivingDistanceCache = {};

    function logWarning(message) {
        if (window.console && typeof window.console.warn === "function") {
            window.console.warn(message);
        }
    }

    function WorkOrderLocationGrouping(latLng) {
        this.latLng     = latLng || null;
        this.workOrders = [];
        this.distance   = Infinity;
    }

    WorkOrderLocationGrouping.prototype.accept = function (workOrder) {
        var isMatch = false;

        if (workOrder) {
            isMatch =
                (this.latLng === null && workOrder.latLng === null) ||
                (this.latLng !== null && this.latLng.equals(workOrder));

            if (isMatch) {
                this.workOrders.push(workOrder);
            }
        }

        return isMatch;
    };

    WorkOrderLocationGrouping.createGrouping = function (workOrders) {
        return workOrders.reduce(function (prev, next) {
            var grouping, matched;

            matched = prev.some(function (g) {
                return g.accept(next);
            });

            if (matched !== true) {
                grouping = new WorkOrderLocationGrouping(next.latLng);
                grouping.workOrders.push(next);
                prev.push(grouping);
            }

            return prev;
        }, []);
    };

    function drivingResponse(resolve, ignore, from, to) {
        return function (data) {
            var result, hasDistance, msg;

            hasDistance =
                data &&
                data.resourceSets &&
                data.resourceSets[0] &&
                data.resourceSets[0].resources &&
                data.resourceSets[0].resources[0] &&
                data.resourceSets[0].resources[0].travelDistance;

            if (hasDistance) {
                result = data.resourceSets[0].resources[0].travelDistance;
                resolve(result);
            } else {
                msg = "Cannot find directions between '{0}' and '{1}'.";
                msg = msg.supplant([ from, to ]);
                logWarning(msg);
                resolve(Infinity);
            }
        };
    }

    function handleError(reject) {
        return function (request, textStatus, errorThrown) {
            logWarning("Provider error", request, textStatus, errorThrown);
            reject(new Error("BingProvider: " + errorThrown));
        };
    }

    function getDrivingDistance(bingMapsKey, fromLatLng, toLatLng) {
        function toWaypoint(c) {
            var template = "{0},{1}";
            return template.supplant([ c.getLatitude(), c.getLongitude() ]);
        }

        var valid =
            fromLatLng instanceof ARS.Models.LatLng &&
            toLatLng instanceof ARS.Models.LatLng;

        if (!valid) {
            return Promise.reject(new Error("Invalid arguments"));
        }

        if (fromLatLng.equals(toLatLng)) {
            return Promise.resolve(0);
        }

        return new Promise(function (resolve, reject) {
            var options, from, to;

            from = toWaypoint(fromLatLng);
            to   = toWaypoint(toLatLng);

            options          = {};
            options.dataType = "jsonp";
            options.jsonp    = "jsonp";

            options.data               = {};
            options.data.key           = bingMapsKey;
            options.data["waypoint.0"] = from;
            options.data["waypoint.1"] = to;
            options.data.du            = "mi"; // mi stands for miles

            options.url = window.location.protocol === "file:" ?
                    "http:" :
                    window.location.protocol;

            options.url += "//dev.virtualearth.net/REST/v1/Routes/Driving";

            options.success = drivingResponse(resolve, reject, from, to);
            options.error = handleError(reject);

            $.ajax(options);
        });
    }

    function GeoLocationService(bingMapsKey) {
        if (!bingMapsKey) {
            throw new Error("Missing parameter: bingMapsKey");
        }

        this.bingMapsKey = bingMapsKey;
    }

    GeoLocationService.prototype.getDrivingDistanceAsync =
        function (fromLatLng, toLatLng) {
            var bingMapsKey, key, match, valid;

            valid =
                fromLatLng instanceof ARS.Models.LatLng &&
                toLatLng instanceof ARS.Models.LatLng;

            if (!valid) {
                return Promise.reject(new Error("Invalid arguments"));
            }

            bingMapsKey = this.bingMapsKey;

            key = [ fromLatLng.toString(), toLatLng.toString() ];
            key = key.join(", ");

            match = drivingDistanceCache[key];

            if (!match) {
                match = getDrivingDistance(bingMapsKey, fromLatLng, toLatLng);
                drivingDistanceCache[key] = match;
            }

            return match;
        };

    GeoLocationService.prototype.getWorkOrderDistancesAsync =
        function (techLatLng, workOrders) {

            if (techLatLng instanceof ARS.Models.LatLng === false) {
                throw new TypeError("Expecting tech coordinates.");
            }

            function flattenResults(results) {
                return results.reduce(function (prev, next) {
                    return prev.concat(next.workOrders.map(function (wo) {
                        wo.distance = next.distance;
                        return wo;
                    }));
                }, []);
            }

            var promises = WorkOrderLocationGrouping
                .createGrouping(workOrders)
                .map(function (grouping) {

                    if (grouping.latLng === null) {
                        return Promise.resolve(grouping);
                    }

                    return this
                        .getDrivingDistanceAsync(techLatLng, grouping.latLng)
                        .then(function (distance) {
                            grouping.distance = distance;
                            return grouping;
                        });
                }, this);

            return Promise.all(promises).then(flattenResults);
        };

    return GeoLocationService;
}());
