/*global ARS */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.SettingsService = (function () {
    "use strict";

    var bingMapsKeyPromise;
    bingMapsKeyPromise= null;

    function bingMapsResponse(settings) {
        return settings[0].ars_Value;
    }

    function SettingsService(dataRepository) {
        if (!dataRepository) {
            throw new Error("Missing parameter: dataRepository");
        }

        this.dataRepository    = dataRepository;
    }

    SettingsService.prototype.getBingMapsKeyAsync = function () {
        var options, type;

        type = "ars_arssetting";
        options =
            "$select=ars_Value&$top=1&$filter=ars_name eq 'Bing Maps Key'";

        if (bingMapsKeyPromise === null) {
            bingMapsKeyPromise = this.dataRepository
                .loadMultipleRecordsAsync(type, options)
                .then(bingMapsResponse);
        }

        return bingMapsKeyPromise;
    };

    return SettingsService;
}());
