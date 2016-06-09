/*global $, ARS */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.TemplateService = (function () {
    "use strict";

    function TemplateService() {
        return undefined;
    }

    TemplateService.prototype.getTemplate = function (templateName) {
        if (!templateName) {
            throw new Error("Missing parameter: templateName");
        }

        var html = $("#" + templateName).text();

        return function (obj) {
            var htmlClone = html.substring(0, html.length - 1);

            Object.keys(obj).forEach(function (key) {
                var re, value;
                re = new RegExp("{{" + key + "}}", "g");
                value = obj[key];
                value = value === undefined || value === null ? "" : value;
                htmlClone = htmlClone.replace(re, value);
            });

            return $(htmlClone.trim());
        };
    };

    return TemplateService;
}());
