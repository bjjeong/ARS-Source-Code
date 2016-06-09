/*global ARS, Promise, SDK */

var ARS;
ARS = ARS || {};
ARS.DataRepository = (function () {
    "use strict";

    function DataRepository() {
        return undefined;
    }

    DataRepository.prototype.createRecordAsync = function (object, type) {
        return new Promise(function (resolve, reject) {
            return Promise.attempt(function () {
                SDK.JQuery.createRecord(object, type, resolve, reject);
            });
        });
    };

    DataRepository.prototype.loadMultipleRecordsAsync =
        function (type, options) {
            return new Promise(function (resolve, reject) {
                return Promise.attempt(function() {
                    var result = [];

                    function success(records) {
                        result = records.concat(result);
                    }

                    function onComplete() {
                        resolve(result);
                    }

                    SDK.JQuery.retrieveMultipleRecords(
                        type,
                        options,
                        success,
                        reject,
                        onComplete
                    );
                });
            });
        };

    DataRepository.prototype.deleteRecordAsync = function (id, type) {
        return new Promise(function (resolve, reject) {
            return Promise.attempt(function () {
                SDK.JQuery.deleteRecord(id, type, resolve, reject);
            });
        });
    };

    DataRepository.prototype.updateRecordAsync = function (id, object, type) {
        return new Promise(function(resolve, reject) {
            return Promise.attempt(function() {
                SDK.JQuery.updateRecord(id, object, type, resolve, reject);
            });
        });
    };

    DataRepository.prototype.getOptionsAsync =
        function (entityName, optionSetAttributeName) {

            function hasLabel(option) {
                return option.OptionMetadata && option.OptionMetadata.Label;
            }

            function mapViewModel(option) {
                var m = {};
                m.label = option.OptionMetadata.Label.UserLocalizedLabel.Label;
                m.value = option.OptionMetadata.Value;
                return m;
            }

            return new Promise(function (resolve, reject) {

                var entityLogicalName, logicalName;

                function success(attributeMetadata) {
                    var hasValue, options;

                    hasValue =
                        attributeMetadata &&
                        attributeMetadata.OptionSet &&
                        attributeMetadata.OptionSet.Options;

                    if (!hasValue) {
                        resolve([]);
                        return;
                    }

                    options = attributeMetadata.OptionSet.Options
                        .filter(hasLabel)
                        .map(mapViewModel);

                    resolve(options);
                }

                entityLogicalName     = entityName.toLowerCase();
                logicalName           = optionSetAttributeName.toLowerCase();

                SDK.MetaData.RetrieveAttributeAsync(
                    entityLogicalName,
                    logicalName,
                    null, // metadataId
                    false, // retrieveAsIfPublished
                    success,
                    reject
                );
            });
        };

    return DataRepository;
}());
