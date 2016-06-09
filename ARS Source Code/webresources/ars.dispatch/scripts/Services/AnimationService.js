/*global $, ARS, window */
/*property
    $container, AnimationService, Services, busyCounter, console, hide,
    hideBusyAnimation, show, showBusyAnimation, warn
*/

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.AnimationService = (function () {
    "use strict";

    function warning() {
        var msg;

        msg = "Busy animation has been hidden before it was shown";

        if (window.console && typeof window.console.warn === "function") {
            window.console.warn(msg);
        }
    }

    function AnimationService(container) {

        var instance = {};
        instance.$container  = $(container);
        instance.busyCounter = 0;

        this.showBusyAnimation = function () {
            instance.busyCounter += 1;
            instance.$container.show();
        };

        this.hideBusyAnimation = function (force) {
            if (force) {
                instance.busyCounter = 0;
            } else {
                if (instance.busyCounter !== 0) {
                    instance.busyCounter -= 1;
                } else {
                    warning();
                }
            }

            if (instance.busyCounter === 0) {
                instance.$container.hide();
            }
        };
    }

    return new AnimationService("#loadingDiv");
}());
