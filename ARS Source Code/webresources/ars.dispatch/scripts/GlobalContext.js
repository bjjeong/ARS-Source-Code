/*global $, ARS, Promise, Xrm, window */

var ARS;
ARS = ARS || {};
ARS.GlobalContext = (function () {
    "use strict";

    var localDomains;

    localDomains = [
        "localhost",
        "ars.dispatch.chris.arkesystems.com"
    ];

    // We are having difficulty with CRM loading the global context.
    //
    // CRM is giving us a path that includes the organization name. This is
    // resulting in a 404 error.
    //
    // If we use a path without the organization name, it works.
    //
    // We do not know why this is, nor how to fix it.  So, this is a hack.

    // Also, we find it useful to know when the global context has
    // finished loading.

    function getWebResourcePath() {
        var component, idx, path;

        path      = window.location.toString();
        component = "/WebResources/";
        idx       = path.indexOf(component);

        if (idx === -1) {
            throw new Error("Cannot resolve WebResources path.");
        }

        return path.substring(0, idx + component.length);
    }

    function unescapeHexString(s) {
        /*jslint unparam: true */
        return s.replace(/\\x([0-9A-F]{2})/gi, function (ignore, c) {
            return String.fromCharCode(parseInt(c, 16));
        });
    }

    /// <summary>
    /// Extract the path to the dynamic script tags included in the
    /// first response.
    /// </summary>
    function getScriptPaths(text) {
        var extractScriptPaths, match, result;

        extractScriptPaths =
            "^document.write\\('<script type=\"text\\/javascript\" " +
            "src=\"'\\+'([^']+?)'\\+'\"><\\/'\\+'script>'\\)$";

        extractScriptPaths = new RegExp(extractScriptPaths, "gm");

        result = [];
        match = extractScriptPaths.exec(text);
        while (match !== null) {
            result.push(unescapeHexString(match[1]));
            match = extractScriptPaths.exec(text);
        }

        return result;
    }

    function getContextPath(text) {
        var extractPath, match;

        extractPath = /^xhr\.open\("GET",\s"([\s\S]+?)"/gm;

        match = extractPath.exec(text);

        if (match) {
            return unescapeHexString(match[1]);
        }

        throw new Error("Cannot resolve ClientGlobalContext.js.aspx path.");
    }

    /// <summary>
    /// Load the dynamic scripts as indicated by the first response.
    /// </summary>
    function loadDynamicScripts(context) {
        var scriptPaths = context.scriptPaths;

        return new Promise(function (resolve, reject) {
            var loadScript, loadNext, settings;

            function failure() {
                var err = new Error("Unable to load " + settings.url);
                reject(err);
            }

            settings = {};
            settings.dataType    = "script";
            settings.contentType = false;
            settings.cache       = true;

            loadScript = function (path) {
                settings.url = path;

                if (path) {
                    $.ajax(settings).then(loadNext, failure);
                } else {
                    resolve(context);
                }
            };

            loadNext = function () {
                loadScript(scriptPaths.shift());
            };

            loadNext();
        });
    }

    function loadClientContext(context) {

        // In this case, we do not fully trust the CRM path.  In our
        // dev environment, it is causing a 404 error.  However, we still
        // want to try it--since we don't know why it broke, we don't know
        // whether it might suddenly be fixed.

        // Note: As of 2015-07-17, this was suddenly fixed.  Let's leave the
        // code here, you know, just in case.  Honestly, it looks like it
        // might break again soon anyway.  The root problem has something to
        // do with the SSL configuration and the way this instance of the
        // CRM installation is licensed.

        return new Promise(function (resolve, reject) {
            var settings;

            function complete() {
                resolve(context);
            }

            settings             = {};
            settings.url         = context.contextPath;
            settings.dataType    = "script";
            settings.contentType = "application/json";

            $.ajax(settings).done(complete).fail(function () {
                var idx;

                // Now try again, removing the organization name from the URL.
                idx          = context.contextPath.indexOf("/", 1);
                settings.url = context.contextPath.substring(idx);

                $.ajax(settings).done(complete).fail(function () {
                    var err;
                    err = "Unable to load ClientGlobalContext.js.aspx";
                    err = new Error(err);
                    reject(err);
                });
            });
        });
    }

    function exportGlobalContext(context) {
        /// <summary>Export a global function.</summary>

        window.GetGlobalContext = function() {
            // ReSharper disable once UndeclaredGlobalVariableUsing
            // The point of this file is to load the libraries that provide
            // the Xrm variable.  This variable won't become available until
            // mid-way through this file's processing.
            return Xrm.Page.context;
        };

        return context;
    }

    /// <summary>Process the first response.</summary>
    function processFirstResponse(response) {
        var result;
        result = {};
        result.scriptPaths = getScriptPaths(response);
        result.contextPath = getContextPath(response);
        return result;
    }

    function GlobalContext() {
        return undefined;
    }

    GlobalContext.prototype.load = function () {
        // We need CRM to tell us the paths to the script tags to load.
        var hostName, url, xhr;

        // The ClientGlobalContext.js.aspx file is a CRM component, and is not
        // available locally.  Local development uses fake data instead.
        hostName = window.location.hostname.toLowerCase();
        if (localDomains.indexOf(hostName) !== -1) {
            return Promise.resolve();
        }

        url = getWebResourcePath() + "ClientGlobalContext.js.aspx";

        xhr = $.ajax({
            url: url,
            dataType: "text" // Override jQuery's guesswork in this case.
        });

        return Promise.resolve(xhr)
            .then(processFirstResponse)
            .then(loadDynamicScripts)
            .then(exportGlobalContext)
            .then(loadClientContext);
    };

    return new GlobalContext();
}());
