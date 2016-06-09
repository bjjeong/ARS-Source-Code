/*global ARS, Promise, Xrm, moment */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.TimeService = (function () {
    "use strict";

    var cache, currentUserTimeZone;
    cache = {};
    currentUserTimeZone = null;

    function timeConversionAsync(service, formatted, code, direction) {
        var action, ns, parts, request;

        ns = {};
        ns.a = "http://schemas.microsoft.com/xrm/2011/Contracts";

        ns.b =
            "http://schemas.datacontract.org" +
            "/2004/07/System.Collections.Generic";

        ns.c = "http://schemas.microsoft.com/xrm/2011/Contracts/Services";
        ns.d = "http://www.w3.org/2001/XMLSchema";
        ns.i = "http://www.w3.org/2001/XMLSchema-instance";
        ns.s = "http://schemas.xmlsoap.org/soap/envelope/";

        request =
            "<s:Envelope xmlns:s=\"{s}\">" +
            "  <s:Body>" +
            "    <Execute xmlns=\"{c}\" xmlns:i=\"{i}\" xmlns:d=\"{d}\">" +
            "      <request xmlns:a=\"{a}\">" +
            "        <a:Parameters xmlns:b=\"{b}\">" +
            "          <a:KeyValuePairOfstringanyType>" +
            "            <b:key>TimeZoneCode</b:key>" +
            "            <b:value i:type=\"d:int\">{code}</b:value>" +
            "          </a:KeyValuePairOfstringanyType>" +
            "          <a:KeyValuePairOfstringanyType>" +
            "            <b:key>{timeName}</b:key>" +
            "            <b:value i:type=\"d:dateTime\">{utcTime}</b:value>" +
            "          </a:KeyValuePairOfstringanyType>" +
            "        </a:Parameters>" +
            "        <a:RequestId i:nil=\"true\"/>" +
            "        <a:RequestName>{requestName}</a:RequestName>" +
            "      </request>" +
            "    </Execute>" +
            "  </s:Body>" +
            "</s:Envelope>";

        parts = {};
        parts.code = ARS.Util.xmlEncode(code.toString());
        parts.utcTime = ARS.Util.xmlEncode(formatted);
        parts.requestName = ARS.Util.xmlEncode(direction);
        parts.timeName = direction === "UtcTimeFromLocalTime" ?
            "LocalTime" : "UtcTime";

        request = request.supplant(ns);
        request = request.supplant(parts);

        action =
            "http://schemas.microsoft.com" +
            "/xrm/2011/Contracts/Services/IOrganizationService/Execute";

        return service.request(action, request).then(function (response) {
            var result;
            result = response.getElementsByTagNameNS(ns.b, "value")[0];

            if (result) {
                result = result.textContent;
                result = result || "";
                result = String(result).trim();
            } else {
                result = null;
            }

            return result;
        });
    }

    function getFromCacheOrServer(service, formatted, code, direction) {
        var key = formatted + " - " + code + " - " + direction;

        if (cache.hasOwnProperty(key) === false) {
            cache[key] =
                timeConversionAsync(service, formatted, code, direction);
        }

        return cache[key];
    }

    function TimeService(fetchXmlService) {
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

    TimeService.prototype.getCurrentUserTimeZoneAsync = function () {
        var query;

        if (currentUserTimeZone === null) {
            query = new ARS.Queries.CurrentUserTimeZoneQuery();
            currentUserTimeZone = query.execute(this.fetchXmlService);
        }

        return currentUserTimeZone;
    };

    TimeService.prototype.getSupportedTimeZonesAsync = function () {
        var query = new ARS.Queries.TimeZoneQuery();
        query.addZone("Eastern Standard Time");
        query.addZone("Central Standard Time");
        query.addZone("Pacific Standard Time");

        // Here we have both Mountain Standard Time and US Mountain Standard
        // Time.  These are two different time zones: one observes DST and one
        // does not.
        //
        // Most of the mountain states are on Mountain Standard Time.
        //
        // Arizona is on US Mountain Standard Time.
        //
        // The Navajo Nation (which is surprisingly large) is (mostly)
        // inside Arizona, and it is on Mountain Standard Time.
        //
        // The Hopi Nation is inside the Navajo Nation, and it is
        // on US Mountain Standard Time.
        query.addZone("Mountain Standard Time");
        query.addZone("US Mountain Standard Time");

        return query.execute(this.fetchXmlService);
    };

    TimeService.prototype.convertTimeZone = function (date, fromZone, toZone) {
        var self = this;

        if (fromZone.equals(toZone)) {
            date = moment(date).format("YYYY-MM-DD[T]HH:mm:ss");
            return Promise.resolve(date);
        }

        return self
            .utcTimeFromLocalTime(date, fromZone)
            .then(function (result) {
                return self.localTimeFromUtcTime(result, toZone);
            });
    };

    TimeService.prototype.localTimeFromUtcTime = function (date, timeZone) {
        var formatted, code, direction, service;
        formatted = moment.utc(date).format("YYYY-MM-DD[T]HH:mm:ss[Z]");
        code      = timeZone.code;
        direction = "LocalTimeFromUtcTime";
        service   = this.fetchXmlService;
        return getFromCacheOrServer(service, formatted, code, direction);
    };

    TimeService.prototype.utcTimeFromLocalTime = function (date, timeZone) {
        var formatted, code, direction, service;
        formatted = moment(date).format("YYYY-MM-DD[T]HH:mm:ss");
        code      = timeZone.code;
        direction = "UtcTimeFromLocalTime";
        service   = this.fetchXmlService;
        return getFromCacheOrServer(service, formatted, code, direction);
    };

    TimeService.prototype.setAppointmentTimeZones =
        function (appointments, timeZone) {
            var resolveTimes, times, zones;

            // Collect the time zones we care about.
            zones = appointments
                .pluck("technician")
                .concat(appointments.pluck("workOrder"))
                .filter(Boolean)
                .pluck("timeZone")
                .concat([ timeZone ])
                .filter(Boolean)
                .distinct(function (a, b) {
                    return a.equals(b);
                });

            // Collect the UTC times.
            times = appointments
                .pluck("utcStart")
                .concat(appointments.pluck("utcEnd"))
                .filter(Boolean)
                .reduce(function (prev, next) {
                    prev[next] = {};
                    return prev;
                }, {});

            // Convert UTC times to time zones in the selected time zones.
            resolveTimes = Object.keys(times).map(function (utcTime) {
                return Promise.all(zones.map(function (zone) {
                    return this
                        .localTimeFromUtcTime(utcTime, zone)
                        .then(function (localTime) {
                            times[utcTime][zone.standardName] = localTime;
                        });
                }, this));
            }, this);

            // Update the appointment's UTC times with zoned times.
            return Promise.all(resolveTimes).then(function () {
                appointments.forEach(function (appointment) {
                    zones.forEach(function (zone) {
                        var end, start;
                        start = times[appointment.utcStart][zone.standardName];
                        end   = times[appointment.utcEnd][zone.standardName];
                        appointment.addLocalSchedule(zone, start, end);
                    });
                });

                return appointments;
            });
        };

    return TimeService;
}());
