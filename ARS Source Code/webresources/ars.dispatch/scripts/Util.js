/*global $, window */
var ARS;
ARS = ARS || {};
ARS.Util = (function () {
    "use strict";

    // ReSharper disable NativeTypePrototypeExtending
    // It's fine, shhh, just sleep now, only dreams.

    // ReSharper disable once InconsistentNaming
    // Wish to match namespace name.
    var Util;

    Util = {};

    Util.xmlEncode = function (raw) {
        /// <summary>Escape a string for XML.</summary>
        /// <returns type="String" />

        return String(raw)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    };

    Util.likeEncode = function (raw) {
        return String(raw)
            .replace(/\[/g, '[[]')
            .replace(/_/g, '[_]')
            .replace(/%/g, '[%]')
            .replace(/'/g, "''");
    };

    return Util;
}());
