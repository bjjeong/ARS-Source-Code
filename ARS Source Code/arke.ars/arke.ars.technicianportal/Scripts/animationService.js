"use strict";

var ARS = ARS || {};

ARS.AnimationService = function () {
    this.busyAnimationCounter = 0;
};

ARS.AnimationService.prototype.showBusyAnimation = function () {
    this.busyAnimationCounter++;
    $("#loadingDiv").show();
};

ARS.AnimationService.prototype.hideBusyAnimation = function (force) {
    if (force) {
        this.busyAnimationCounter = 0;
    } else {
        if (this.busyAnimationCounter !== 0) {
            this.busyAnimationCounter--;
        } else {
            console.warn("Busy animation has been hidden before it was shown");
        }
    }

    if (this.busyAnimationCounter === 0) {
        $("#loadingDiv").hide();
    }
};