"use strict";

var ARS = ARS || {};

ARS.NotificationService = function () {};

ARS.NotificationService.prototype.showError = function (errorReason) {
    console.log(errorReason);
    $.notify({ message: errorReason }, { type: "danger" });
};

ARS.NotificationService.prototype.showNotification = function (message) {
    console.log(message);
    $.notify({ message: message });
};