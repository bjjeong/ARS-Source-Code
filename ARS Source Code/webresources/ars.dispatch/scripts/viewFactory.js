/*global $, ARS */

var ARS;
ARS = ARS || {};
ARS.ViewFactory = (function () {
    "use strict";

    function ViewFactory() {
        return undefined;
    }

    ViewFactory.prototype.createMapView = function (
        bingMapsKey,
        geoLocationService,
        notificationService
    ) {
            if (!bingMapsKey) {
                throw new Error("Missing parameter: bingMapsKey");
            }

            if (!geoLocationService) {
                throw new Error("Missing parameter: geoLocationService");
            }

            return new ARS.Views.MapView(
                $("#map"),
                bingMapsKey,
                geoLocationService,
                notificationService
            );
        };

    ViewFactory.prototype.createCalendarView =
        function (workOrderProvider, userTimeZone, timeZones) {
            var container = $("#calendar");
            return new ARS.Views.CalendarView(
                container,
                workOrderProvider,
                userTimeZone,
                timeZones
            );
        };

    ViewFactory.prototype.createWorkOrderView = function (templateService) {
        if (!templateService) {
            throw new Error("Missing parameter: templateService");
        }

        var container = $(".work-orders-list").first();

        return new ARS.Views.WorkOrderView(container, templateService);
    };

    return ViewFactory;
}());
