/*global ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Filters = ARS.Filters || {};
ARS.Filters.DateRangeFilter = (function () {
    "use strict";

    function DateRangeFilter(start, end) {
        if (!start) {
            throw new Error("Missing parameter: start");
        }

        if (!end) {
            throw new Error("Missing parameter: end");
        }

        Object.defineProperties(this, {
            start: {
                get: function () {
                    return start;
                }
            },
            end: {
                get: function () {
                    return end;
                }
            }
        });
    }

    DateRangeFilter.prototype =
        Object.create(ARS.Filters.FilterBase.prototype);

    DateRangeFilter.prototype.constructor = DateRangeFilter;

    DateRangeFilter.prototype.applyToServiceAppointmentQuery =
        function (query) {
            query.endsAfter    = this.start;
            query.startsBefore = this.end;
        };

    return DateRangeFilter;
}());
