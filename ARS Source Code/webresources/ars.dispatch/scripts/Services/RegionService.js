/*global ARS */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.RegionService = (function () {
    "use strict";

    var request = null;

    function mapViewModel(region) {
        var viewModel      = {};
        viewModel.regionId = region.ars_regionId;
        viewModel.name     = region.ars_name;
        return viewModel;
    }

    function mapResponse(response) {
        return response.map(mapViewModel);
    }

    function createRequest(dataRepository) {
        var options, type;
        type = "ars_region";
        options = "&$orderby=ars_name&$select=ars_name,ars_regionId";
        return dataRepository
            .loadMultipleRecordsAsync(type, options)
            .then(mapResponse);
    }

    function cachedRequest(dataRepository) {
        if (request === null) {
            request = createRequest(dataRepository);
        }

        return request;
    }

    function RegionService(dataRepository) {
        if (!dataRepository) {
            throw new Error("Missing parameter: dataRepository");
        }

        this.dataRepository = dataRepository;
    }

    RegionService.prototype.getRegionsAsync = function () {
        return cachedRequest(this.dataRepository);
    };

    return RegionService;
}());
