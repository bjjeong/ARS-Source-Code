var ARS;
ARS = ARS || {};
ARS.Models = ARS.Models || {};
ARS.Models.IncidentStatusCode = (function () {
    "use strict";

    function IncidentStatusCode(label, value) {
        label = String(label || "").trim();
        value = parseInt(value, 10);

        if (isNaN(value)) {
            throw new TypeError("value must be a number.");
        }

        if (isFinite(value) === false) {
            throw new RangeError("value must be finite.");
        }

        Object.defineProperties(this, {
            label: {
                get: function () {
                    return label;
                }
            },
            value: {
                get: function () {
                    return value;
                }
            }
        });
    }

    IncidentStatusCode.fromOptionSet = function (optionSet) {
        return new IncidentStatusCode(optionSet.label, optionSet.value);
    };

    return IncidentStatusCode;
}());
