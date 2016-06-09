/*global ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Fakes = ARS.Fakes || {};
ARS.Fakes.FakeDataRepository = (function () {
    "use strict";

    var bingMapsKey;

    bingMapsKey =
        "AuEtawEchNJulYYGvBSox23IKjKh2ZWoA5QHI-V4Leh5gmSfHygoM1S8GENc-7Zv";

    function resolveSetting(options) {
        var result;

        if (options.indexOf("ars_name eq 'Bing Maps Key'") !== -1) {
            result = {};
            result.ars_Value = bingMapsKey;
            result = [ result ];

            return Promise.resolve(result);
        }

        result = "Unknown setting: " + options;
        return Promise.reject(result);
    }

    function FakeDataRepository() {
        return undefined;
    }

    FakeDataRepository.prototype.loadMultipleRecordsAsync =
        function (type, options) {
            var msg, parts;

            if (type === "ars_arssetting") {
                return resolveSetting(options);
            }

            parts         = {};
            parts.type    = type;
            parts.options = options;

            msg =
                "Fake has not been yet provided for entity '{type}' and " +
                "following options '{options}'";

            msg = msg.supplant(parts);
            return Promise.reject(msg);
        };

    return FakeDataRepository;
}());
