/*global ARS, Promise, moment */

var ARS;
ARS = ARS || {};
ARS.Fakes = ARS.Fakes || {};
ARS.Fakes.FakeWorkOrderService = (function () {
    "use strict";
    /*jslint unparam: true */

    var arke, lorem, statusCodes, workOrders;

    function byWorkOrderId(id) {
        return function (item) {
            return item.id === id;
        };
    }

    arke = "3400 Peachtree Rd NE\r\nSuite 200\r\nAtlanta, GA 30326\r\nUSA";

    lorem = // Test very long work order names.
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do " +
        "eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut " +
        "enim ad minim veniam, quis nostrud exercitation ullamco laboris " +
        "nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor " +
        "in reprehenderit in voluptate velit esse cillum dolore eu fugiat " +
        "nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
        "sunt in culpa qui officia deserunt mollit anim id est laborum";

    statusCodes = [
        { label: "Pending",            value:         2 },
        { label: "Accepted",           value: 172860000 },
        { label: "Scheduled",          value: 172860002 },
        { label: "In Progress",        value:         1 },
        { label: "Technician Offsite", value: 172860003 },
        { label: "Work Complete",      value: 172860004 },
        { label: "Recall",             value: 172860001 },
        { label: "Return",             value: 100000000 },
        { label: "Closed",             value:         5 },
        { label: "Canceled",           value:         6 },
        { label: "Merged",             value:      2000 }
    ];

    workOrders = [
        {
            id:               "fc98a5e5-9ee9-e411-80cf-000d3a20df62",
            addressComposite: "4675 Highway 136 West\r\nTalking Rock 30175",
            completeByDate:   "2015-06-01",
            duration:         3,
            latitude:         34.507779,
            longitude:        -84.506602,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01022-L9F9C0",
            timeZone:         "Eastern Standard Time",
            title:            "Broken interior door handle"
        }, {
            id:               "27f7525e-a9c9-e411-9427-00155d03c107",
            addressComposite: "1350 Walton Way\r\nAugusta 30901",
            completeByDate:   "2015-06-01",
            duration:         8,
            latitude:         33.472469,
            longitude:        -81.979959,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01004-F2K7H1",
            timeZone:         "Eastern Standard Time",
            title:            "Cracked floor tiles"
        }, {
            id:               "1529fff6-48c4-e411-a4fc-00155d03c107",
            addressComposite: arke,
            completeByDate:   null,
            duration:         28,
            latitude:         33.849084,
            longitude:        -84.364832,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01001-K2K6T5",
            timeZone:         "Eastern Standard Time",
            title:            "Expand the Day to 28 Hours"
        }, {
            id:               "595ea483-49c4-e411-a4fc-00155d03c107",
            addressComposite: arke,
            completeByDate:   "2015-06-01",
            duration:         0.15,
            isEmergency:      true,
            latitude:         33.849084,
            longitude:        -84.364832,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01002-Y4T9N2",
            timeZone:         "Eastern Standard Time",
            title:            "Fix This Now!!"
        }, {
            id:               "564139b2-4ac4-e411-a4fc-00155d03c107",
            addressComposite: arke,
            completeByDate:   "2015-06-01",
            duration:         5.5,
            latitude:         33.849084,
            longitude:        -84.364832,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01003-Z7Q5C4",
            timeZone:         "Eastern Standard Time",
            title:            "Help - Roof Leaking!!"
        }, {
            id:               "6476ad1f-cdc1-e411-b4b6-00155d03c107",
            addressComposite: arke,
            completeByDate:   "2015-06-01",
            duration:         2.75,
            latitude:         33.849084,
            longitude:        -84.364832,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "CAS-01000-X8G0D6",
            timeZone:         "Eastern Standard Time",
            title:            "Leaking Sprinkler System"
        }, {
            id:               "d5ace6f6-bdc9-e411-bde7-00155d03c107",
            addressComposite: arke,
            completeByDate:   "2015-06-01",
            duration:         8,
            latitude:         33.849084,
            longitude:        -84.364832,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01005-F5Q6T3",
            timeZone:         "Eastern Standard Time",
            title:            "Need Technician - Wall Damage"
        }, {
            id:               "6216e6ac-bec9-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         4,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01006-M2F4F6",
            timeZone:         "Eastern Standard Time",
            title:            "New Work Order Received For CRM:0001001"
        }, {
            id:               "7d1b943b-c6cc-e411-bde7-00155d03c107",
            addressComposite: "1350 Walton Way\r\nAugusta 30901",
            completeByDate:   "2015-06-01",
            duration:         4,
            latitude:         33.472469,
            longitude:        -81.979959,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01007-X3M5N1",
            timeZone:         "Eastern Standard Time",
            title:            "Receive Building Permit for #123 CRM:0001952"
        }, {
            id:               "345bc48b-d7cc-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         3,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01008-C3Y0B1",
            timeZone:         "Eastern Standard Time",
            title:            "Review Proposed Site for #123 CRM:0001968"
        }, {
            id:               "c51259c5-6ccd-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         3,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01009-D7K0Q0",
            timeZone:         "Eastern Standard Time",
            title:            "Review Proposed Site for #123 CRM:0001997"
        }, {
            id:               "f5b3d542-6ecd-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         3,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01010-K3P6D3",
            timeZone:         "Eastern Standard Time",
            title:            "Test WO"
        }, {
            id:               "5b6fa0d0-69d1-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         240,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01011-B6F4V4",
            timeZone:         "Eastern Standard Time",
            title:            "Initiative Failed So Spectacularly"
        }, {
            id:               "fb06049e-6bd1-e411-bde7-00155d03c107",
            addressComposite: arke,
            completeByDate:   "2015-06-01",
            duration:         4,
            latitude:         33.849084,
            longitude:        -84.364832,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01012-Y1J5M8",
            timeZone:         "Eastern Standard Time",
            title:            "Too Many Cats"
        }, {
            id:               "c49d5798-d1d1-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         69,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01013-T5K3N5",
            timeZone:         "Eastern Standard Time",
            title:            "I Need an Adult"
        }, {
            id:               "9215d57a-d2d1-e411-bde7-00155d03c107",
            addressComposite: "90 Marietta Station Walk NE, Marietta",
            completeByDate:   "2015-06-01",
            duration:         1,
            latitude:         33.954605,
            longitude:        -84.551169,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01014-B3W9P3",
            timeZone:         "Eastern Standard Time",
            title:            "Something Is Wrong"
        }, {
            id:               "2e5d0c0a-d3d1-e411-bde7-00155d03c107",
            addressComposite: "4675 Highway 136 West\r\nTalking Rock 30175",
            completeByDate:   "2015-06-01",
            duration:         2,
            latitude:         34.507779,
            longitude:        -84.506602,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01015-T4K6T3",
            timeZone:         "Eastern Standard Time",
            title:            "Squirrels."
        }, {
            id:               "2942a685-d3d1-e411-bde7-00155d03c107",
            addressComposite: "339 W Church St\r\nJasper 30143",
            completeByDate:   "2015-06-01",
            duration:         null,
            latitude:         34.466377,
            longitude:        -84.433027,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01016-J1X7V1",
            timeZone:         "Eastern Standard Time",
            title:            "Lacking in Soul"
        }, {
            id:               "011fefbf-d3d1-e411-bde7-00155d03c107",
            addressComposite: "49 S Main St\r\nJasper 30143",
            completeByDate:   "2015-06-01",
            duration:         1.5,
            latitude:         34.467282,
            longitude:        -84.429536,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01017-Y5Y6C7",
            timeZone:         "Eastern Standard Time",
            title:            "I'm Hungry, Bring Me a Snack"
        }, {
            id:               "e4b50508-d4d1-e411-bde7-00155d03c107",
            addressComposite: "158 Church Street Southeast\r\nRanger 30734",
            completeByDate:   "2015-06-01",
            duration:         19,
            latitude:         34.499644,
            longitude:        -84.711723,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01018-N1P6N5",
            timeZone:         "Eastern Standard Time",
            title:            "Reality Is Thin"
        }, {
            id:               "1a8e7460-d4d1-e411-bde7-00155d03c107",
            addressComposite: "4675 Highway 136 West\r\nTalking Rock 30175",
            completeByDate:   "2015-06-01",
            duration:         Infinity,
            latitude:         34.507779,
            longitude:        -84.506602,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01019-Q6R9L9",
            timeZone:         "Eastern Standard Time",
            title:            lorem
        }, {
            id:               "4a99d0f6-d4d1-e411-bde7-00155d03c107",
            addressComposite: "339 W Church St\r\nJasper 30143",
            completeByDate:   "2015-06-01",
            duration:         3,
            latitude:         34.466377,
            longitude:        -84.433027,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01020-C9S9S1",
            timeZone:         "Eastern Standard Time",
            title:            "Need Some Trees Planted"
        }, {
            id:               "487867ce-05d3-e411-bde7-00155d03c107",
            addressComposite: null,
            completeByDate:   "2015-06-01",
            duration:         3,
            latitude:         null,
            longitude:        null,
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            ticketNumber:     "WO-01021-W2T8W2",
            timeZone:         "Eastern Standard Time",
            title:            "Pastry-Based Pareidolia"
        }, {
            id:               "8248fd17-7db4-4515-b6fb-1d9fe24479b8",
            addressComposite: "Juneau, Alaska",
            completeByDate:   "2015-08-24",
            duration:         3,
            latitude:         58.301944,
            longitude:        -134.419722,
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            ticketNumber:     "WO-01024-W2T8W2",
            timeZone:         "Alaskan Standard Time",
            title:            "Return my library book"
        }, {
            id:               "4ba441ab-4f19-4db3-af7d-fac79d680708",
            addressComposite: "Barrow, Alaska",
            completeByDate:   null,
            duration:         3,
            latitude:         71.371438,
            longitude:        -156.449432,
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            ticketNumber:     "WO-01025-W2T8W2",
            timeZone:         "Alaskan Standard Time",
            title:            "I'm cold.  Why am I so cold?"
        }
    ];

    function mapToModel(vm, timeZones) {
        var completeByDate, latLng, model;

        completeByDate =
            vm.completeByDate ? moment(vm.completeByDate).toDate() : null;

        latLng = ARS.Models.LatLng.tryCreate(vm.latitude, vm.longitude);

        model                    = new ARS.Models.WorkOrderModel();
        model.workOrderId        = vm.id;
        model.addressComposite   = vm.addressComposite;
        model.completeByDate     = completeByDate;
        model.isEmergency        = vm.isEmergency;
        model.latLng             = latLng;
        model.schedulingComplete = Boolean(vm.schedulingComplete);
        model.status             = vm.status || "Accepted";
        model.ticketNumber       = vm.ticketNumber;
        model.timeZone           = timeZones[vm.timeZone];
        model.title              = vm.title;
        return model;
    }

    function applyRegionFilter(list, regionFilter) {
        var selected = regionFilter.getSelected();

        return list.filter(function (wo) {
            return selected.indexOf(wo.regionId) !== -1;
        });
    }

    function applyWorkOrderFilter(list, workOrderFilter) {
        var codes, completed;
        completed = workOrderFilter.includeCompletedSchedules;
        codes = workOrderFilter.selectedCodes.map(function (value) {
            return statusCodes.filter(function (sc) {
                return sc.value === value;
            }).pluck("label").first() || null;
        });

        return list.filter(function (wo) {
            var code = wo.status || "Accepted";

            if (codes.indexOf(code) === -1) {
                return false;
            }

            if (completed === false) {
                if (wo.schedulingComplete === true) {
                    return false;
                }
            }

            return true;
        });
    }

    function applyFilters(filters) {
        filters = filters || [];

        return filters.reduce(function (list, filter) {
            if (filter instanceof ARS.Filters.RegionFilter) {
                return applyRegionFilter(list, filter);
            }

            if (filter instanceof ARS.Filters.WorkOrderFilter) {
                return applyWorkOrderFilter(list, filter);
            }

            // Could do all users and ticket filter here, if needed.
            return list;
        }, workOrders);
    }

    function FakeWorkOrderService() {
        return undefined;
    }

    FakeWorkOrderService.prototype.getWorkOrdersAsync =
        function (filters, paging) {
            var filtered, hasMore, page, perPage, result, skip,
                take, timeZones;

            paging    = paging || {};
            page      = paging.page || 1;
            perPage   = 20;
            skip      = (page - 1) * perPage;
            take      = page * perPage;
            filtered  = applyFilters(filters);
            result    = filtered.slice(skip, take);
            timeZones = ARS.Fakes.FakeTimeService.getTimeZones();
            hasMore   =
                result.length === perPage &&
                result[perPage - 1] !== filtered[filtered.length - 1];


            result = result.map(function (entity) {
                return mapToModel(entity, timeZones);
            });

            return Promise.resolve({
                workOrders: result,
                pagingCookie: "whatever",
                moreRecords: hasMore
            });
        };

    FakeWorkOrderService.prototype.getStatusCodesAsync = function () {
        return Promise.resolve(statusCodes.slice(0));
    };

    function setStatus(workOrder, status, completed) {
        var entity;

        workOrder.status = status;
        workOrder.schedulingComplete = completed;

        entity = workOrders.first(byWorkOrderId(workOrder.workOrderId));
        if (entity) {
            entity.status = status;
            entity.schedulingComplete = completed;
        }

        return Promise.resolve();
    }

    FakeWorkOrderService.prototype.assignWorkOrder = function (workOrder) {
        return setStatus(workOrder, "Scheduled", true);
    };

    FakeWorkOrderService.prototype.unassignWorkOrder = function (workOrder) {
        return setStatus(workOrder, "Accepted", false);
    };

    FakeWorkOrderService.prototype.getWorkOrderDuration =
        function (workOrderId) {
            var workOrder = workOrders.first(byWorkOrderId(workOrderId));

            if (workOrder) {
                return Promise.resolve(workOrder.duration);
            }

            return Promise.reject(new Error("Work order not found."));
        };

    FakeWorkOrderService.prototype.toggleCompleted = function (workOrder) {
        var completed = !workOrder.schedulingComplete;
        return setStatus(workOrder, workOrder.status, completed);
    };

    FakeWorkOrderService.getById = function (workOrderId) {
        var entity, timeZones;
        entity = workOrders.first(byWorkOrderId(workOrderId));
        timeZones = ARS.Fakes.FakeTimeService.getTimeZones();
        return entity ? mapToModel(entity, timeZones) : null;
    };

    return FakeWorkOrderService;
}());
