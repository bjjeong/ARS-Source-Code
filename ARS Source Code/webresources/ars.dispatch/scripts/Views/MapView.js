/*global $, ARS, Microsoft, moment, Promise, window */

var ARS;
ARS = ARS || {};
ARS.Views = ARS.Views || {};
ARS.Views.MapView = (function () {
    "use strict";

    // ReSharper disable UndeclaredGlobalVariableUsing
    // The "Microsoft" variable is not available during parsing.

    var dateFormat, pinType;

    pinType             = {};
    pinType.WORKORDER   = "workOrder";
    pinType.APPOINTMENT = "appointment";
    pinType.TECHNICIAN  = "technician";

    dateFormat = "MMM Do YYYY, h:mm a";

    function logWarning(message) {
        if (window.console && typeof window.console.warn === "function") {
            window.console.warn(message);
        }
    }

    function getPinBounds(mapView) {
        var locations = mapView.pins
            .pluck("latLng")
            .execute("toMicrosoftLatLng");

        return locations.length > 0 ?
            Microsoft.Maps.LocationRect.fromLocations(locations) : null;
    }

    function createDescription(obj) {
        var description, lines;

        lines = Object.keys(obj).filter(function (key) {
            return obj[key];
        }).map(function (key) {
            return key + ": " + obj[key];
        });

        description = "<div class=\"infobox-body\">{0}</div>";
        return description.supplant([ lines.join("<br />") ]);
    }

    function removePushpin(instance, pin) {
        var i, pushpin;

        for (i = instance.dataLayer.getLength() - 1; i >= 0; i -= 1) {
            pushpin = instance.dataLayer.get(i);

            if (pushpin === pin.mapPin) {
                instance.dataLayer.removeAt(i);
            }
        }

        instance.pins.remove(pin);
    }

    function clearByPinType(mapView, type) {
        mapView.pins.filter(function (pin) {
            return pin.type === type;
        }).forEach(removePushpin.bind(null, mapView));
    }

    function pushWorkOrder(instance, workOrder) {
        var coords, id, info, valid;

        valid = workOrder && workOrder.latLng instanceof ARS.Models.LatLng;

        if (!valid) {
            return false;
        }

        info                = {};
        info.Address        = workOrder.addressComposite;
        info["Ticket #"]    = workOrder.ticketNumber;
        info["Complete By"] =
            moment(workOrder.completeByDate).format(dateFormat);

        coords = workOrder.latLng;
        id     = workOrder.workOrderId;

        instance.drawPushPin(coords, id, pinType.WORKORDER, info);
        return true;
    }

    function pushTechnician(instance, technician) {
        var id, infoBlock, latLng, type, valid;

        valid = technician && technician.latLng instanceof ARS.Models.LatLng;

        if (!valid) {
            return false;
        }

        id     = technician.technicianId;
        latLng = technician.latLng;
        type   = pinType.TECHNICIAN;

        infoBlock         = {};
        infoBlock.Name    = technician.name;
        infoBlock.Address = technician.addressComposite;

        instance.drawPushPin(latLng, id, type, infoBlock);
        return true;
    }

    function pushAppointment(instance, appointment) {
        var id, infoBlock, latLng, type, valid;

        valid =
            appointment &&
            appointment.workOrder &&
            appointment.workOrder.latLng instanceof ARS.Models.LatLng;

        if (!valid) {
            return false;
        }

        latLng    = appointment.workOrder.latLng;
        id        = appointment.appointmentId;
        type      = pinType.APPOINTMENT;
        infoBlock = {};

        infoBlock["Ticket #"] = appointment.workOrder.ticketNumber;
        infoBlock.Address     = appointment.workOrder.addressComposite;

        infoBlock.Start = moment(appointment.start)
            .format("MMM Do YYYY, h:mm a");

        infoBlock.End = moment(appointment.end)
            .format("MMM Do YYYY, h:mm a");

        instance.drawPushPin(latLng, id, type, infoBlock);
        return true;
    }

    function tryAddPins(mapView, addFn, pins) {
        var unplottable, warning;

        unplottable = pins.filter(function (pin) {
            return addFn(mapView, pin) === false;
        });

        if (unplottable.length) {
            warning = unplottable.length === 1 ?
                    "Ignored {0} unplottable item." :
                    "Ignored {0} unplottable items.";

            warning = warning.supplant([ unplottable.length ]);
            mapView.notificationService.showNotification(warning);
        }
    }

    function MapView(
        container,
        bingMapKey,
        geoLocationService,
        notificationService
    ) {
        if (!container) {
            throw new Error("container is required");
        }

        if (!bingMapKey) {
            throw new Error("bingMapKey is required");
        }

        if (!geoLocationService) {
            throw new Error("geoLocationService is required");
        }

        if (!window.Microsoft || !window.Microsoft.Maps) {
            throw new Error("Bing maps was not loaded");
        }

        if (!notificationService) {
            throw new Error("notificationService is required.");
        }

        this.geoLocationService = geoLocationService;
        this.notificationService = notificationService;

        this.map = new Microsoft.Maps.Map($(container)[0], {
            credentials: bingMapKey,
            zoom: 7
        });

        this.dataLayer = new Microsoft.Maps.EntityCollection();
        this.map.entities.push(this.dataLayer);

        this.infoboxLayer = new Microsoft.Maps.EntityCollection();
        this.map.entities.push(this.infoboxLayer);

        this.infobox =
            new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(0, 0), {
                visible: false,
                offset:  new Microsoft.Maps.Point(0, 20),
                height:  100
            });

        this.infoboxLayer.push(this.infobox);

        this.pins = [];

        Microsoft.Maps.Events
            .addHandler(this.map, "viewchange", this.clearInfoBox.bind(this));
    }

    MapView.prototype.drawPushPin =
        function (latLng, id, type, descriptionData) {
            if (latLng instanceof ARS.Models.LatLng === false) {
                logWarning("Unplottable location.");
                return;
            }

            var location, pin, pinOptions;

            pinOptions = {};

            pin               = {};
            pin.latLng        = latLng;
            pin.type          = type;
            pin.id            = id;
            pin.description   = createDescription(descriptionData);
            this.pins.push(pin);

            switch (type) {
            case pinType.WORKORDER:
                pinOptions.icon = "images/point_red.png";
                // This icon is designed around the default values for
                // height, width, and anchor.
                pin.infoBoxHeight = 100;
                break;

            case pinType.APPOINTMENT:
                pinOptions.icon   = "images/point_green.png";
                pinOptions.height = 30;
                pinOptions.width  = 31;
                pinOptions.anchor = new Microsoft.Maps.Point(29, 29);
                pin.infoBoxHeight = 100;
                break;

            case pinType.TECHNICIAN:
                pinOptions.icon   = "images/point_blue.png";
                pinOptions.height = 33;
                pinOptions.width  = 33;
                pinOptions.anchor = new Microsoft.Maps.Point(2, 32);
                pin.infoBoxHeight = 70;
                break;
            }

            location = latLng.toMicrosoftLatLng();

            pin.mapPin =
                new Microsoft.Maps.Pushpin(location, pinOptions);

            Microsoft.Maps.Events.addHandler(
                pin.mapPin,
                "mouseover",
                this.showInfoBox.bind(this, pin)
            );

            this.dataLayer.push(pin.mapPin);
        };

    MapView.prototype.showInfoBox = function (pin) {
        this.infobox.setLocation(pin.latLng.toMicrosoftLatLng());
        this.infobox.setOptions({
            visible:     true,
            description: pin.description,
            height:      pin.infoBoxHeight
        });
    };

    MapView.prototype.clearInfoBox = function () {
        this.infobox.setOptions({ visible: false });
    };

    MapView.prototype.clearTechnicians = function () {
        clearByPinType(this, pinType.TECHNICIAN);
    };

    MapView.prototype.addTechnicians = function (technicians) {
        technicians = technicians || [];
        technicians = technicians.distinct(function (a, b) {
            return a.equals(b);
        });

        tryAddPins(this, pushTechnician, technicians);
    };

    MapView.prototype.clearWorkOrders = function () {
        clearByPinType(this, pinType.WORKORDER);
    };

    MapView.prototype.addWorkOrders = function (workOrders) {
        workOrders = workOrders || [];
        workOrders = workOrders.distinct(function (a, b) {
            return a.equals(b);
        });

        tryAddPins(this, pushWorkOrder, workOrders);
    };

    MapView.prototype.clearAppointments = function () {
        clearByPinType(this, pinType.APPOINTMENT);
    };

    MapView.prototype.addAppointments = function (appointments) {
        appointments = appointments || [];
        appointments = appointments.filter(function (appointment) {
            return Boolean(appointment.workOrder);
        }).distinct(function (a, b) {
            return a.equals(b);
        });

        tryAddPins(this, pushAppointment, appointments);
    };

    MapView.prototype.zoomToPins = function () {
        var viewOptions     = {};
        viewOptions.padding = 100;
        viewOptions.bounds  = getPinBounds(this);

        if (viewOptions.bounds) {
            this.map.setView(viewOptions);
        }
    };

    MapView.prototype.selectWorkOrder = function (workOrder) {
        var pin, workOrderId, viewOptions;

        workOrderId = workOrder ? workOrder.workOrderId : null;

        pin = this.pins.first(function (p) {
            return p.type === pinType.WORKORDER && p.id === workOrderId;
        });

        if (pin) {
            viewOptions         = {};
            viewOptions.animate = false;
            viewOptions.padding = 100;
            viewOptions.bounds  = getPinBounds(this);

            this.map.setView(viewOptions);
            this.showInfoBox(pin);
        }
    };

    return MapView;
}());
