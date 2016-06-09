/*global $, ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Filters = ARS.Filters || {};
ARS.Filters.TicketFilter = (function () {
    "use strict";

    function Behavior(instance) {
        this.attach = function () {
            instance.$element.on("keyup", this.onKeyUp_Element);
        };

        this.onKeyUp_Element = function (e) {
            var bubbled = new $.Event(e, { type: "changeTicket" });
            $(instance.self).triggerHandler(bubbled);
        };
    }

    function TicketFilter(attribute, element) {
        if (!attribute) {
            throw new Error("Missing parameter: attribute");
        }

        if (!element) {
            throw new Error("Missing parameter: element");
        }

        var instance       = {};
        instance.$element  = $(element);
        instance.attribute = attribute;
        instance.behavior  = new Behavior(instance);
        instance.self      = this;

        this.getAttribute = function () {
            return instance.attribute;
        };

        this.getValue = function () {
            return instance.$element.val();
        };

        instance.behavior.attach();
    }

    TicketFilter.prototype = Object.create(ARS.Filters.FilterBase.prototype);
    TicketFilter.prototype.constructor = TicketFilter;

    TicketFilter.prototype.applyToWorkOrderQuery = function (query) {
        query.ticket = this.getValue();
    };

    return TicketFilter;
}());
