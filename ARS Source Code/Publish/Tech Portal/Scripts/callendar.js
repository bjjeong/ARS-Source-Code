"use strict";

$(function () {
    var animationService = new ARS.AnimationService();
    var notificationService = new ARS.NotificationService();

    window.addEventListener("unhandledrejection", function (e) {
        e.preventDefault();
        var reason = e.detail.reason;
        notificationService.showError(reason);
        animationService.hideBusyAnimation(true);
    });
});
