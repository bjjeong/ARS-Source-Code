/*global $, moment, Promise, Xrm */

var ARS;
ARS = ARS || {};
ARS.Services = ARS.Services || {};
ARS.Services.FetchXmlService = (function () {
    "use strict";

    var fetchXmlService, ns;

    fetchXmlService = {};

    ns = {};
    ns.a = "http://schemas.microsoft.com/xrm/2011/Contracts";
    ns.b = "http://schemas.microsoft.com/xrm/2011/Contracts/Services";
    ns.c = "http://www.w3.org/2001/XMLSchema-instance";
    ns.d = "http://schemas.xmlsoap.org/soap/envelope/";
    ns.e =
        "http://schemas.datacontract.org/2004/07/System.Collections.Generic";

    function OptionSetValue(label, value) {
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

    function EntityReference(value) {
        var id, logicalName;

        id = value.getElementsByTagNameNS(ns.a, "Id")[0];
        logicalName = value.getElementsByTagNameNS(ns.a, "LogicalName")[0];

        id = id ? id.textContent || null : null;
        logicalName = logicalName ? logicalName.textContent || null : null;

        Object.defineProperties(this, {
            id: {
                get: function () {
                    return id;
                }
            },
            logicalName: {
                get: function () {
                    return logicalName;
                }
            }
        });
    }

    function PartialOptionSetValue(value) {
        this.value = value;
    }

    function parseValue(value, type) {
        var isNull = value.getAttributeNS(ns.c, "nil") === "true";

        if (isNull) {
            return null;
        }

        switch (type) {
        case "a:AliasedValue":
            value = value.getElementsByTagNameNS(ns.a, "Value")[0];
            type  = value.getAttributeNS(ns.c, "type");
            return parseValue(value, type);

        case "a:EntityReference":
            return new EntityReference(value);

        case "a:OptionSetValue":
            value = value.getElementsByTagNameNS(ns.a, "Value")[0];
            value = parseValue(value, "c:int");
            return new PartialOptionSetValue(value);

        case "c:boolean":
            return value.textContent === "true";

        case "c:dateTime":
            return moment(value.textContent).toDate();

        case "c:double":
        case "c:decimal":
            return parseFloat(value.textContent);

        case "c:int":
        case "c:long":
            return parseInt(value.textContent, 10);

        case "c:guid":
        case "c:string":
            return String(value.textContent || "");

        default:
            throw new Error("Unrecognized type: " + type);
        }
    }

    function parseAttr(attr) {
        var key, type, value;
        key   = attr.getElementsByTagNameNS(ns.e, "key")[0];
        value = attr.getElementsByTagNameNS(ns.e, "value")[0];

        if (key && value) {
            key   = String(key.textContent || "");
            type  = value.getAttributeNS(ns.c, "type");
            value = parseValue(value, type);
            return { key: key, value: value };
        }

        throw new Error("Unrecognized attribute");
    }

    function parseFormatted(kvp) {
        var key, value;
        key   = kvp.getElementsByTagNameNS(ns.e, "key")[0];
        value = kvp.getElementsByTagNameNS(ns.e, "value")[0];

        if (key && value) {
            key   = String(key.textContent || "");
            value = parseValue(value, "c:string");
            return { key: key, value: value };
        }

        throw new Error("Unrecognized formatted value");
    }

    function parseKeyValuePairs(entity, tagName, pairName, parseFn) {
        var pairs = entity.getElementsByTagNameNS(ns. a, tagName);

        if (!pairs[0]) {
            return {};
        }

        pairs = pairs[0].getElementsByTagNameNS(ns.a, pairName);

        return $.makeArray(pairs).reduce(function (prev, next) {
            var attr = parseFn(next);
            prev[attr.key] = attr.value;
            return prev;
        }, {});
    }

    function parseAttributePairs(entity) {
        var pairName, parseFn, tagName;
        tagName  = "Attributes";
        pairName = "KeyValuePairOfstringanyType";
        parseFn  = parseAttr;
        return parseKeyValuePairs(entity, tagName, pairName, parseFn);
    }

    function parseFormattedValuePairs(entity) {
        var pairName, parseFn, tagName;
        tagName  = "FormattedValues";
        pairName = "KeyValuePairOfstringstring";
        parseFn  = parseFormatted;
        return parseKeyValuePairs(entity, tagName, pairName, parseFn);
    }

    function parseEntity(entity) {
        var attrs, formatted;

        attrs     = parseAttributePairs(entity);
        formatted = parseFormattedValuePairs(entity);

        Object.keys(attrs).filter(function (key) {
            return attrs[key] instanceof PartialOptionSetValue;
        }).forEach(function (key) {
            var label, value;
            value = attrs[key].value;
            label = formatted.hasOwnProperty(key) ? formatted[key] : null;
            attrs[key] = new OptionSetValue(label, value);
        });

        return attrs;
    }

    function parseBool(node) {
        var parsed = node ? node.textContent : "false";
        return String(parsed || "").trim() === "true";
    }

    function parsePagingCookie(doc) {
        var cookie = doc.getElementsByTagNameNS(ns.a, "PagingCookie")[0];

        if (!cookie) {
            return null;
        }

        if (cookie.getAttributeNS(ns.c, "nil") === "true") {
            return null;
        }

        return String(cookie.textContent || "").trim();
    }

    function parseDocument(doc) {
        var result = {};

        result.entities = doc.getElementsByTagNameNS(ns.a, "Entity");
        result.entities = $.makeArray(result.entities).map(parseEntity);

        result.entityName = doc.getElementsByTagNameNS(ns.a, "EntityName")[0];
        result.entityName =
            result.entityName ? result.entityName.textContent : null;

        result.moreRecords =
            doc.getElementsByTagNameNS(ns.a, "MoreRecords")[0];

        result.moreRecords = parseBool(result.moreRecords);

        result.pagingCookie = parsePagingCookie(doc);

        result.totalRecordCountLimitExceeded =
            doc.getElementsByTagNameNS(ns.a, "TotalRecordCountLimitExceeded");

        result.totalRecordCountLimitExceeded =
            parseBool(result.totalRecordCountLimitExceeded[0]);

        result.totalRecordCount =
            doc.getElementsByTagNameNS(ns.a, "TotalRecordCount")[0];

        result.totalRecordCount = result.totalRecordCount ?
            parseInt(result.totalRecordCount.textContent, 10) : null;

        if (isNaN(result.totalRecordCount)) {
            result.totalRecordCount = null;
        }

        return result;
    }

    fetchXmlService.request = function (action, data) {
        var settings = {};
        settings.data               = data;
        settings.dataType           = "xml";
        settings.method             = "POST";
        settings.processData        = false;

        // ReSharper disable once UndeclaredGlobalVariableUsing
        // The Xrm variable is not available at parse time.
        settings.url                = Xrm.Page.context.getClientUrl();
        settings.url               += "/XRMServices/2011/Organization.svc/web";

        settings.contentType        = "text/xml; charset=utf-8";
        settings.headers            = {};
        settings.headers.SOAPAction = action;
        return Promise.resolve($.ajax(settings));
    };

    fetchXmlService.retrieveMultiple = function (fetchXml) {
        var action, request;

        request =
            "<d:Envelope" +
            "  xmlns:d=\"{d}\"" + 
            "  xmlns:a=\"{a}\"" + 
            "  xmlns:c=\"{c}\"" + 
            "  xmlns:b=\"{b}\">" +
            "  <d:Header>" +
            "    <a:SdkClientVersion>6.0</a:SdkClientVersion>" +
            "  </d:Header>" +
            "  <d:Body>" +
            "    <b:RetrieveMultiple>" +
            "      <b:query c:type=\"a:FetchExpression\">" +
            "        <a:Query>{fetchXml}</a:Query>" +
            "      </b:query>" +
            "    </b:RetrieveMultiple>" +
            "  </d:Body>" +
            "</d:Envelope>";

        request = request.supplant(ns);

        // XML Encoding something that is already valid XML... *facepalm*
        request = request.supplant({
            fetchXml: ARS.Util.xmlEncode(fetchXml)
        });

        action =
            "http://schemas.microsoft.com" +
            "/xrm/2011/Contracts/Services" +
            "/IOrganizationService/RetrieveMultiple";

        return fetchXmlService.request(action, request).then(parseDocument);
    };

    fetchXmlService.OptionSetValue = OptionSetValue;

    return fetchXmlService;
}());
