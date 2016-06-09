var ARS;
ARS = ARS || {};
ARS.Models = ARS.Models || {};
ARS.Models.Technician = (function () {
    "use strict";

    function getterFor(context, name) {
        return function () {
            return context[name];
        };
    }

    function stringValue(context, name) {
        return {
            get: getterFor(context, name),
            set: function (value) {
                context[name] = value === null || value === undefined ?
                    null :
                    String(value).trim();
            }
        };
    }

    function getCompositeAddress(tech) {
        var result = [ tech.streetAddress, tech.city, tech.state, tech.zip ];
        return result.filter(Boolean).join(" ");
    }

    function Technician() {
        var instance = {};
        instance.technicianId = null;
        instance.city         = null;
        instance.latLng       = null;
        instance.name         = null;
        instance.state        = null;
        instance.street       = null;
        instance.timeZone     = null;
        instance.zip          = null;

        [
            "technicianId", "city", "name", "state", "street", "zip"
        ].forEach(function (key) {
            Object.defineProperty(this, key, stringValue(instance, key));
        }, this);

        Object.defineProperties(this, {
            addressComposite: {
                get: function () {
                    return getCompositeAddress(this);
                }
            },
            latLng: {
                get: getterFor(instance, "latLng"),
                set: function (value) {
                    instance.latLng =
                        value instanceof ARS.Models.LatLng ? value : null;
                }
            },
            timeZone: {
                get: getterFor(instance, "timeZone"),
                set: function (value) {
                    instance.timeZone =
                        value instanceof ARS.Models.TimeZone ? value : null;
                }
            }
        });
    }

    Technician.prototype.equals = function (other) {
        if (other instanceof Technician === false) {
            return false;
        }

        if (this.technicianId === null) {
            return other.technicianId === null;
        }

        if (other.technicianId === null) {
            return false;
        }

        var a, b;
        a = this.technicianId.toLowerCase();
        b = other.technicianId.toLowerCase();

        return a === b;
    };

    Technician.prototype.toHtml = function (template) {
        var viewModel = {};

        [
            "technicianId", "street", "city", "state", "zip", "name"
        ].forEach(function (prop) {
            viewModel[prop] = this[prop] || "";
        }, this);

        viewModel.latLng = this.latLng ?
            this.latLng.toPointString() : "";

        viewModel.timeZone = this.timeZone ?
            this.timeZone.standardName || "" :
            null;

        return template(viewModel);
    };

    return Technician;
}());
