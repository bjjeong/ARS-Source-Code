/*global $, ARS, Promise, window */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.NotificationService = (function () {
    "use strict";

    var config;
    config = {};
    config.displayTime = 4000;

    function logError(reason) {
        if (window.console && typeof window.console.error === "function") {
            window.console.error(reason);
        }
    }

    function logInfo(reason) {
        if (window.console && typeof window.console.log === "function") {
            window.console.log(reason);
        }
    }

    function showBoxAsync($box, $text, message) {
        return new Promise(function (resolve) {
            $text.text(message);
            $box.show("slow", function () {
                window.setTimeout(function () {
                    $box.hide("slow", resolve);
                }, config.displayTime);
            });
        });
    }

    function showErrorTask(message) {
        var $box, $text;
        $box  = $(".error-box");
        $text = $(".error-text");
        return function () {
            return showBoxAsync($box, $text, message);
        };
    }

    function showInfoTask(message) {
        var $box, $text;
        $box  = $(".info-box");
        $text = $(".message-text");
        return function () {
            return showBoxAsync($box, $text, message);
        };
    }

    function NotificationService() {

        var instance     = {};
        instance.current = null;
        instance.queue   = [];

        function startQueue() {
            var task;

            if (instance.current === null) {
                task = instance.queue.shift();
                if (task) {
                    instance.current = task().finally(function () {
                        instance.current = null;
                        startQueue();
                    });
                }
            }
        }

        this.showError = function (reason) {
            logError(reason);
            instance.queue.push(showErrorTask(reason));
            startQueue();
        };

        this.showNotification = function (message) {
            logInfo(message);
            instance.queue.push(showInfoTask(message));
            startQueue();
        };
    }

    return NotificationService;
}());
