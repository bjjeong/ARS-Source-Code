/*global $, ARS, Promise, Xrm */
/*property
    $element, AllUsersFilter, Event, FilterBase, Filters, allUsers,
    applyToWorkOrderQuery, attach, behavior, constructor, create, is,
    isChecked, on, onChange_Element, prototype, self, triggerHandler, type
*/

var ARS;
ARS = ARS || {};
ARS.Filters = ARS.Filters || {};
ARS.Filters.AllUsersFilter = (function () {
    "use strict";

    function Behavior(instance) {
        this.attach = function () {
            instance.$element.on("change", this.onChange_Element);
        };

        this.onChange_Element = function (e) {
            var bubbled, props;

            props = {};
            props.type = "changeAllUsers";

            bubbled = new $.Event(e, props);

            $(instance.self).triggerHandler(bubbled);
        };
    }

    function AllUsersFilter(element) {
        if (!element) {
            throw new Error("Missing parameter: element");
        }

        var instance = {};
        instance.$element = $(element);
        instance.behavior = new Behavior(instance);
        instance.self = this;

        this.isChecked = function () {
            return instance.$element.is(":checked");
        };

        instance.behavior.attach();
    }

    AllUsersFilter.prototype = Object.create(ARS.Filters.FilterBase.prototype);
    AllUsersFilter.prototype.constructor = AllUsersFilter;

    AllUsersFilter.prototype.applyToWorkOrderQuery = function (query) {
        query.allUsers = this.isChecked();
    };

    return AllUsersFilter;
}());
