/*global $, ARS, google, Microsoft, window */

var ARS;
ARS = ARS || {};
ARS.Models = ARS.Models || {};
ARS.Models.LatLng = (function () {
    "use strict";
    /*jslint unparam: true */

    var pointRe = /^POINT\ \((-?\d+(?:\.\d+))\ (-?\d+(?:\.\d+))\)$/;

    function googleMapsDefined() {
        return window.google &&
            window.google.maps &&
            $.isFunction(window.google.maps.LatLng);
    }

    function bingMapsDefined() {
        return window.Microsoft &&
            window.Microsoft.Maps &&
            $.isFunction(window.Microsoft.Maps.Location);
    }

    function isGoogleLatLng(value) {
        return googleMapsDefined() &&
            value instanceof window.google.maps.LatLng;
    }

    function isMicrosoftLatLng(value) {
        return bingMapsDefined() &&
            value instanceof window.Microsoft.Maps.Location;
    }

    function isGeographyPoint(value) {
        pointRe.lastIndex = 0;
        value = value === null || value === undefined ? "" : String(value);
        return pointRe.test(value);
    }

    function LatLng(latitude, longitude) {
        /// <signature>
        ///   <summary>Describe latitude and longitude.</summary>
        ///   <param name="gLatLng" type="google.maps.LatLng">
        ///     Google LatLng
        ///   </param>
        /// </signature>
        /// <signature>
        ///   <summary>Describe latitude and longitude.</summary>
        ///   <param name="gLatLng" type="Microsoft.Maps.Location">
        ///     Microsoft Maps Location
        ///   </param>
        /// </signature>
        /// <signature>
        ///   <summary>Describe latitude and longitude.</summary>
        ///   <param name="latitude" type="Number">Latitude</param>
        ///   <param name="longitude" type="Number">Longitude</param>
        /// </signature>
        /// <signature>
        ///   <summary>Describe latitude and longitude.</summary>
        ///   <param name="point" type="SqlGeography.Point">
        ///     Sql Geography
        ///   </param>
        /// </signature>

        var instance, match;

        instance = {};
        instance.lat = null;
        instance.lng = null;

        this.getLatitude = function () {
            return instance.lat;
        };

        this.getLongitude = function () {
            return instance.lng;
        };

        if (isGoogleLatLng(latitude)) {
            instance.lat = latitude.lat();
            instance.lng = latitude.lng();
        } else if (isMicrosoftLatLng(latitude)) {
            instance.lat = latitude.latitude;
            instance.lng = latitude.longitude;
        } else if (isGeographyPoint(latitude)) {
            match = pointRe.exec(latitude);
            instance.lat = Number(match[2]);
            instance.lng = Number(match[1]);
        } else {
            if (latitude === null || latitude === undefined) {
                throw new Error("Expecting a latitude.");
            }

            if (longitude === null || longitude === undefined) {
                throw new Error("Expecting a longitude.");
            }

            instance.lat = Number(latitude);
            instance.lng = Number(longitude);

            if (isNaN(instance.lat)) {
                throw new TypeError("latitude must be a number");
            }

            if (isNaN(instance.lng)) {
                throw new TypeError("longitude must be a number.");
            }

            if (instance.lat < -90 || instance.lat > 90) {
                throw new RangeError("latitude must range from -90 to 90.");
            }

            if (instance.lng < -180 || instance.lng > 180) {
                throw new RangeError("longitude must range from -180 to 180.");
            }
        }
    }

    LatLng.tryCreate = function (latitude, longitude) {
        try {
            return new LatLng(latitude, longitude);
        } catch (ex) {
            return null;
        }
    };

    LatLng.prototype.toGoogleLatLng = function () {
        var lat, lng;
        if (googleMapsDefined()) {
            lat = this.getLatitude();
            lng = this.getLongitude();
            return new window.google.maps.LatLng(lat, lng);
        }

        return null;
    };

    LatLng.prototype.toMicrosoftLatLng = function () {
        var lat, lng;
        if (bingMapsDefined()) {
            lat = this.getLatitude();
            lng = this.getLongitude();
            return new window.Microsoft.Maps.Location(lat, lng);
        }

        return null;
    };

    LatLng.prototype.toString = function () {
        /// <summary>Return a lat lng combination as a string.</summary>
        var result = [ this.getLatitude(), this.getLongitude() ];
        result = result.join(", ");
        return result;
    };

    LatLng.prototype.toPointString = function () {
        /// <summary>Render this lat lng as a SqlGeography POINT</summary>
        var result =
            "POINT (" + this.getLongitude() + " " + this.getLatitude() + ")";

        return result;
    };

    LatLng.prototype.equals = function (latLng) {
        /// <summary>Compare a LatLng object with this LatLng.</summary>
        /// <param name="latLng" type="LatLng">
        ///   The LatLng object to compare with.
        /// </param>
        /// <return type="boolean">True if equal; otherwise, false.</return>

        if (latLng && latLng instanceof LatLng) {
            return this.getLatitude() === latLng.getLatitude &&
                this.getLongitude() === latLng.getLongitude();
        }

        return false;
    };

    LatLng.prototype.getDistanceInMiles = function (latLng) {

        function toRadians(value) {
            return value * Math.PI / 180;
        }

        if (latLng instanceof LatLng === false) {
            throw new TypeError("Expecting a LatLng.");
        }

        var a, earthRadius, latDistance, lngDistance;

        earthRadius = 3959;

        latDistance = toRadians(latLng.getLatitude() - this.getLatitude());
        lngDistance = toRadians(latLng.getLongitude() - this.getLongitude());

        a = // haversine formula
            Math.sin(latDistance / 2) *
            Math.sin(latDistance / 2) +
            Math.cos(toRadians(this.getLatitude())) *
            Math.cos(toRadians(latLng.getLatitude())) *
            Math.sin(lngDistance / 2) *
            Math.sin(lngDistance / 2);

        return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    return LatLng;
}());
