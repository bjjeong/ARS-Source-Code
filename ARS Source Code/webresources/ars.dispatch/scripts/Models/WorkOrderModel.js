/*global moment */

var ARS;
ARS = ARS || {};
ARS.Models = ARS.Models || {};
ARS.Models.WorkOrderModel = (function () {
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

    function WorkOrderModel() {
        var instance = {};
        instance.workOrderId        = null;
        instance.addressComposite   = null;
        instance.completeByDate     = null;
        instance.distance           = null;
        instance.isEmergency        = null;
        instance.schedulingComplete = false;
        instance.status             = null;
        instance.latLng             = null;
        instance.ticketNumber       = null;
        instance.timeZone           = null;
        instance.title              = null;
        instance.locationName       = null;

        [
            "workOrderId", "addressComposite", "status",
            "ticketNumber", "title", "locationName"
        ].forEach(function (key) {
            Object.defineProperty(this, key, stringValue(instance, key));
        }, this);

        Object.defineProperties(this, {
            completeByDate: {
                get: getterFor(instance, "completeByDate"),
                set: function (value) {
                    instance.completeByDate =
                        value instanceof Date ? value : null;
                }
            },
            distance: {
                get: getterFor(instance, "distance"),
                set: function (value) {
                    value = parseFloat(value);
                    instance.distance = isNaN(value) ? null : value;
                }
            },
            isEmergency: {
                get: getterFor(instance, "isEmergency"),
                set: function (value) {
                    instance.isEmergency = Boolean(value);
                }
            },
            latLng: {
                get: getterFor(instance, "latLng"),
                set: function (value) {
                    instance.latLng =
                        value instanceof ARS.Models.LatLng ? value : null;
                }
            },
            schedulingComplete: {
                get: getterFor(instance, "schedulingComplete"),
                set: function (value) {
                    instance.schedulingComplete = Boolean(value);
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

    WorkOrderModel.prototype.equals = function (other) {
        if (other instanceof WorkOrderModel === false) {
            return false;
        }

        if (this.workOrderId === null) {
            return other.workOrderId === null;
        }

        if (other.workOrderId === null) {
            return false;
        }

        var a, b;
        a = this.workOrderId.toLowerCase();
        b = other.workOrderId.toLowerCase();

        return a === b;
    };

    WorkOrderModel.prototype.toHtml = function (template) {
        var viewModel = {};

        viewModel.workOrderId        = this.workOrderId || "";
        viewModel.addressComposite   = this.addressComposite || "";
        viewModel.status             = this.status || "";
        viewModel.schedulingComplete = this.schedulingComplete.toString();
        viewModel.ticketNumber       = this.ticketNumber || "";
        viewModel.title              = this.title || "";
        viewModel.locationName       = this.locationName || "";

        viewModel.latLng   = this.latLng ? this.latLng.toPointString() : "";
        viewModel.timeZone = this.timeZone ? this.timeZone.standardName : "";

        if (this.completeByDate !== null) {
            viewModel.completeByDateFormatted = "Complete By: ";
            viewModel.completeByDateFormatted +=
                moment(this.completeByDate).format("MM/DD/YYYY h:mm A");

            viewModel.completeByDate =
                this.completeByDate.valueOf().toString();
        } else {
            viewModel.completeByDateFormatted = "";
            viewModel.completeByDate = "";
        }

        if (this.distance !== null) {
            viewModel.distance = this.distance.toString();

            if (isFinite(this.distance)) {
                viewModel.distanceFormatted = this.distance.toFixed(1);
                viewModel.distanceFormatted +=
                    viewModel.distanceFormatted === "1.0" ? " mile" : " miles";
            } else {
                viewModel.distanceFormatted = "";
            }

        } else {
            viewModel.distance = "";
            viewModel.distanceFormatted = "";
        }

        if (this.isEmergency) {
            viewModel.isEmergency = this.isEmergency ? "true" : "false";
            viewModel.isEmergencyFormatted =
                this.isEmergency ? "emergency" : "";
        } else {
            viewModel.isEmergency = "false";
            viewModel.isEmergencyFormatted = "";
        }

        return template(viewModel);
    };

    return WorkOrderModel;
}());
