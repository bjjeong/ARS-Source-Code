/*global ARS, Promise, moment, window */

var ARS;
ARS = ARS || {};
ARS.Fakes = ARS.Fakes || {};
ARS.Fakes.FakeTimeService = (function () {
    "use strict";

    var knownZones, supportedZones;

    supportedZones = [
        {
            userInterfaceName: "(GMT-05:00) Eastern Time (US & Canada)",
            timeZoneCode: 35,
            standardName: "Eastern Standard Time",
            offset: -300,
            dstOffset: -240
        }, {
            userInterfaceName: "(GMT-06:00) Central Time (US & Canada)",
            timeZoneCode: 20,
            standardName: "Central Standard Time",
            offset: -360,
            dstOffset: -300
        }, {
            userInterfaceName: "(GMT-07:00) Arizona",
            timeZoneCode: 15,
            standardName: "US Mountain Standard Time",
            offset: -420,
            dstOffset: -420
        }, {
            userInterfaceName: "(GMT-07:00) Mountain Time (US & Canada)",
            timeZoneCode: 10,
            standardName: "Mountain Standard Time",
            offset: -420,
            dstOffset: -360
        }, {
            userInterfaceName: "(GMT-08:00) Pacific Time (US & Canada)",
            timeZoneCode: 4,
            standardName: "Pacific Standard Time",
            offset: -480,
            dstOffset: -420
        }
    ];

    knownZones = supportedZones.slice(0);
    knownZones.push({
        userInterfaceName: "(GMT-09:00) Alaska",
        timeZoneCode: 3,
        standardName: "Alaskan Standard Time",
        offset: -540,
        dstOffset: -480
    });

    function toTimeZone(zone) {
        var name, code, ui;
        name = zone.standardName;
        code = zone.timeZoneCode;
        ui   = zone.userInterfaceName;
        return ARS.Models.TimeZone.getOrCreate(name, ui, code);
    }

    function getOffset(date, tz) {
        var rawZone;

        rawZone = knownZones.first(function (z) {
            return z.timeZoneCode === tz.code;
        });

        if (!rawZone) {
            window.console.error("Cannot find offset.");
            return 0;
        }

        return moment(date).isDST() ?
            rawZone.dstOffset : rawZone.offset;
    }

    function FakeTimeService() {
        return undefined;
    }

    FakeTimeService.prototype.getCurrentUserTimeZoneAsync = function () {
        var model = toTimeZone(supportedZones[0]);
        return Promise.resolve(model);
    };

    FakeTimeService.prototype.getSupportedTimeZones = function () {
        return supportedZones.map(toTimeZone);
    };

    FakeTimeService.prototype.getSupportedTimeZonesAsync = function () {
        return Promise.resolve(this.getSupportedTimeZones());
    };

    FakeTimeService.prototype.localTimeFromUtcTime = function (date, tz) {
        var offset = getOffset(date, tz);

        date = moment.utc(date)
            .add(offset, "minutes")
            .format("YYYY-MM-DD[T]HH:mm:ss");

        return Promise.resolve(date);
    };

    FakeTimeService.prototype.utcTimeFromLocalTime = function (date, tz) {
        var offset = getOffset(date, tz);

        date = moment(date)
            .subtract(offset, "minutes")
            .format("YYYY-MM-DD[T]HH:mm:ss[Z]");

        return Promise.resolve(date);
    };

    FakeTimeService.prototype.setAppointmentTimeZones =
        function (appointments, timeZone) {
            return ARS.Services.TimeService.prototype.setAppointmentTimeZones
                .call(this, appointments, timeZone);
        };

    FakeTimeService.prototype.convertTimeZone = function (date, from, to) {
        return ARS.Services.TimeService.prototype.convertTimeZone
            .call(this, date, from, to);
    };

    // for faking things
    FakeTimeService.getTimeZones = function () {
        return knownZones.reduce(function (prev, next) {
            prev[next.standardName] = toTimeZone(next);
            return prev;
        }, {});
    };

    return FakeTimeService;
}());
