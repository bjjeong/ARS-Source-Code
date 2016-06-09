/*global ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Fakes = ARS.Fakes || {};
ARS.Fakes.FakeRegionService = (function () {
    "use strict";

    var regions = [{
        id:   "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
        name: "Alaska"
    }, {
        id:   "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
        name: "Alabama"
    }, {
        id:   "9d376648-d624-4df5-a183-055c77267154",
        name: "California"
    }, {
        id:   "29dfbda4-1fbf-46ba-88d3-037a002d6556",
        name: "Georgia"
    }];

    function mapViewModel(entity) {
        var viewModel = {};
        viewModel.regionId = entity.id;
        viewModel.name     = entity.name;
        return viewModel;
    }

    function FakeRegionService() {
        return undefined;
    }

    FakeRegionService.prototype.getRegionsAsync = function () {
        return Promise.resolve(regions.map(mapViewModel));
    };

    return FakeRegionService;
}());
