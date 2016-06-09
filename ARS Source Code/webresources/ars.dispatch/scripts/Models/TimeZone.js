var ARS;
ARS = ARS || {};
ARS.Models = ARS.Models || {};
ARS.Models.TimeZone = (function () {
    "use strict";

    var cache = {};

    function TimeZone(standardName, userInterfaceName, code) {
        standardName = String(standardName || "").trim();
        userInterfaceName = String(userInterfaceName || "").trim();

        if (!standardName) {
            throw new Error("standardName is required.");
        }

        if (!userInterfaceName) {
            throw new Error("userInterfaceName is required.");
        }

        code = parseInt(code, 10);

        if (isNaN(code)) {
            throw new TypeError("code must be a number.");
        }

        if (isFinite(code) === false) {
            throw new RangeError("code must be finite.");
        }

        Object.defineProperties(this, {
            // The standard name corresponds with values in the
            // HKEY_LOCAL_MACHINE\Software\Microsoft\Windows NT
            // \CurrentVersion\Time Zones branch of the Windows registry.
            //
            // This can be used with TimeZoneInfo.FindSystemTimeZoneById to
            // get time zone information in a C# environment.
            //
            // CRM also uses thes values to locate
            // timezonedefinition entities.  We can use this as a key value
            // to match time zone data, and to look up extended time zone
            // information (such as the offset or DST rules) from CRM.
            standardName: {
                get: function () {
                    return standardName;
                }
            },

            // CRM provides this, and we use it in the drop down.
            userInterfaceName: {
                get: function () {
                    return userInterfaceName;
                }
            },

            // CRM uses this to convert UTC times to a specific time zone.
            // Although CRM provides sufficient data that we could handle
            // this client-side, doing so seems complicated at the moment.
            code: {
                get: function () {
                    return code;
                }
            }
        });
    }

    TimeZone.prototype.equals = function (other) {
        if (other instanceof TimeZone === false) {
            return false;
        }

        return this.standardName === other.standardName;
    };

    TimeZone.getCachedValue = function (standardName) {
        return cache[standardName] || null;
    };

    TimeZone.getOrCreate = function (standardName, userInterfaceName, code) {
        if (cache.hasOwnProperty(standardName) === false) {
            cache[standardName] =
                new TimeZone(standardName, userInterfaceName, code);
        }

        return cache[standardName];
    };

    return TimeZone;
}());
