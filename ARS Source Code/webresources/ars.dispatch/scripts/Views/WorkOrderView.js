/*global $, ARS, moment */

var ARS;
ARS = ARS || {};
ARS.Views = ARS.Views || {};
ARS.Views.WorkOrderView = (function () {
    "use strict";

    var emptyFooter = $(".footer").html();

    function Behavior(instance) {

        this.attach = function () {
            var ev, sel, fn;
            ev = "click";
            sel = ".work-order";
            fn = this.onClick_WorkOrder;
            instance.$container.on(ev, sel, fn);

            fn = this.onClick_SortByTechnician;
            $("[data-action='sort-by-technician']").on(ev, fn);

            fn = this.onClick_SortByWorkOrder;
            $("[data-action='sort-by-order']").on(ev, fn);
        };

        this.onClick_SortByTechnician = function (ev) {
            var bubble = new $.Event(ev, { type: "sortByTechnician" });
            $(instance.self).triggerHandler(bubble);
        };

        this.onClick_SortByWorkOrder = function (ev) {
            var bubble = new $.Event(ev, { type: "sortByWorkOrder" });
            $(instance.self).triggerHandler(bubble);
        };

        this.onClick_WorkOrder = function (ev) {
            var bubble;

            instance.self.selectByElement(ev.target);

            bubble = new $.Event(ev, { type: "changeWorkOrder" });
            $(instance.self).triggerHandler(bubble);
        };
    }

    function mapElementToWorkOrder($element) {
        var completeByDate, latLng, model, timeZone;

        completeByDate = $element.data("work-order-complete-by-date");
        if (completeByDate) {
            completeByDate = new Date(completeByDate);
        } else {
            completeByDate = null;
        }

        latLng = $element.data("work-order-lat-lng") || "";
        latLng = ARS.Models.LatLng.tryCreate(latLng);

        timeZone = $element.data("work-order-time-zone") || "";
        timeZone =
            timeZone ? ARS.Models.TimeZone.getCachedValue(timeZone) : null;

        model = new ARS.Models.WorkOrderModel();
        model.workOrderId      = $element.data("work-order-id");
        model.addressComposite = $element.data("work-order-address");
        model.completeByDate   = completeByDate;
        model.distance         = $element.data("work-order-distance");
        model.isEmergency      = $element.data("work-order-is-emergency");
        model.latLng           = latLng;

        model.schedulingComplete =
            $element.data("work-order-scheduling-complete");

        model.status       = $element.data("work-order-status");
        model.ticketNumber = $element.data("work-order-ticket-number");
        model.title        = $element.data("work-order-title");
        model.locationName = $element.data("work-order-location-name");
        model.timeZone     = timeZone;

        return model;
    }

    function addEventData(workOrder, $element) {
        // store data so the calendar knows to render an event upon drop
        var eventData = {};

        // use the element's text as the event title
        eventData.title = $.trim($element.text());

        // maintain when user navigates (see docs on the
        // renderEvent method)
        eventData.stick = true;

        eventData.workOrderId = workOrder.workOrderId;

        $element.data("event", eventData);
    }

    function makeDraggable($element, view) {
        // make the event draggable using jQuery UI
        $element.draggable({
            zIndex: 999,
            helper: "clone",
            appendTo: "body",
            revert: true,      // will cause the event to go back to its
            revertDuration: 0, // original position after the drag
            start: function (evt) {
                var bubble = new $.Event(evt, { type: "dragStart" });
                $(view).triggerHandler(bubble);
            },
            stop: function (evt) {
                var bubble = new $.Event(evt, { type: "dragStop" });
                $(view).triggerHandler(bubble);
            }
        });
    }

    function WorkOrderView(container, templateService) {
        if (!templateService) {
            throw new Error("Missing parameter: templateService");
        }

        var instance = {};
        instance.$container      = $(container);
        instance.behavior        = new Behavior(instance);
        instance.self            = this;
        instance.templateService = templateService;
        instance.page            = 0;
        instance.pagingCookie    = null;

        Object.defineProperties(this, {
            page: {
                get: function () {
                    return instance.page;
                }
            },
            pagingCookie: {
                get: function () {
                    return instance.pagingCookie;
                }
            }
        });

        this.clearSelection = function () {
            instance.$container.find(".active").removeClass("active");
            $("[data-action='sort-by-order']").prop("disabled", true);
        };

        this.selectByElement = function (element) {
            var $element = $(element).closest(".work-order");
            if ($element.parent().is(instance.$container)) {
                this.clearSelection();
                $element.addClass("active");
                $("[data-action='sort-by-order']").prop("disabled", false);
            }
        };

        this.getSelectedWorkOrder = function () {
            var $element = instance.$container.find(".active");
            return this.getWorkOrderByElement($element[0]);
        };

        this.clearWorkOrders = function () {
            instance.page = 0;
            instance.pagingCookie = null;
            instance.$container.empty();
        };

        this.addWorkOrders = function (workOrderPage) {
            var template;

            instance.page += 1;
            instance.pagingCookie = workOrderPage.pagingCookie;

            template = instance.templateService
                .getTemplate("workOrderTemplate");

            workOrderPage.workOrders.forEach(function (wo) {
                var $element;
                $element = wo.toHtml(template).appendTo(instance.$container);
                addEventData(wo, $element);
                makeDraggable($element, this);
            }, this);

            if (workOrderPage.hasMore) {
                $(".loadmore").find(".nomore").hide();
                $(".loadmore").find("img").show();
            } else {
                $(".loadmore").find(".nomore").show();
                $(".loadmore").find("img").hide();
            }
        };

        this.clearDistances = function () {
            instance.$container.find(".work-order .distance").remove();
        };

        this.getWorkOrders = function () {
            return instance.$container
                .find(".work-order")
                .toArray()
                .map(function (html) {
                    return mapElementToWorkOrder($(html));
                });
        };

        this.showWorkOrderDetails = function (workOrder) {
            $(".footer").empty();

            var template = instance.templateService
                .getTemplate("workOrderDetailsTemplate");

            workOrder.toHtml(template).appendTo(".footer");
        };

        this.clearSelection();
        instance.behavior.attach();
    }

    WorkOrderView.prototype.getWorkOrderById = function (id) {
        return this.getWorkOrders().first(function (wo) {
            return wo.workOrderId === id;
        });
    };

    WorkOrderView.prototype.getWorkOrderByElement = function (el) {
        var $element;

        $element = $(el).closest(".work-order");

        if ($element.length === 0) {
            return null;
        }

        return mapElementToWorkOrder($element);
    };

    WorkOrderView.prototype.clearWorkOrderDetails = function () {
        $(".footer").html(emptyFooter);
    };

    return WorkOrderView;
}());
