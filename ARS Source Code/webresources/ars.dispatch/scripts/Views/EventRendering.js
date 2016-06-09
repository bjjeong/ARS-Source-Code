/*global $, moment, window */

var ARS;
ARS = window.ARS || {};
ARS.Views = ARS.Views || {};
ARS.Views.EventRendering = (function () {
    "use strict";

    // ReSharper disable once InconsistentNaming
    // Name should match namespaced name.
    var EventRendering = {};

    function getTechnician(event) {
        var hasValue;

        hasValue =
            event &&
            event.appointment &&
            event.appointment.technician;

        return hasValue ? event.appointment.technician : null;
    }

    function getWorkOrder(event) {
        var hasValue;

        hasValue =
            event &&
            event.appointment &&
            event.appointment.workOrder;

        return hasValue ? event.appointment.workOrder : null;
    }

    function timeTableRow(targetZone, title, event) {
        var parts, schedule, template;

        schedule = event.appointment.getLocalSchedule(targetZone);

        template =
            "<tr>" +
            "    <th class=\"zone\">{title}:</th>" +
            "    <td class=\"start\">{start}</td>" +
            "    <td class=\"separator\">-</td>" +
            "    <td class=\"end\">{end}</td>" +
            "    <td class=\"name\">{name}</td>" +
            "</tr>";

        parts = {};
        parts.title = title.toHtmlString();
        parts.start = moment(schedule.start).format("h:mm a");
        parts.end   = moment(schedule.end).format("h:mm a");
        parts.name  = targetZone.userInterfaceName || targetZone.standardName;
        parts.name  = String(parts.name || "").toHtmlString();
        return template.supplant(parts);
    }

    function timeTableRowFor(selectedZone, item, title, event) {
        var hasValue;

        hasValue =
            item &&
            item.timeZone &&
            item.timeZone.equals(selectedZone) === false;

        if (!hasValue) {
            return "";
        }

        return timeTableRow(item.timeZone, title, event);
    }

    function techTimeTableRow(timeZone, event) {
        var item, title;
        item  = getTechnician(event);
        title = "Technician Time Zone";
        return timeTableRowFor(timeZone, item, title, event);
    }

    function workOrderTimeTableRow(timeZone, event) {
        var item, title;
        item  = getWorkOrder(event);
        title = "Location Time Zone";
        return timeTableRowFor(timeZone, item, title, event);
    }

    function renderTimeZoneTable(event, timeZone, element) {
        var parts, timeTable;

        timeTable =
            "<div class=\"timeTable\"><table>" +
            "    {techTime}" +
            "    {locationTime}" +
            "</table></div>";

        parts              = {};
        parts.techTime     = techTimeTableRow(timeZone, event);
        parts.locationTime = workOrderTimeTableRow(timeZone, event);

        if (parts.techTime || parts.locationTime) {
            timeTable = timeTable.supplant(parts);
            element.find(".fc-title").before(timeTable);
        }
    }

    function renderLateTechnician(event, element) {
        var isLate;

        isLate =
            event &&
            event.appointment &&
            event.appointment.technicianIsLate;

        if (isLate) {
            element.addClass("technicianIsLate");
        }
    }

    function renderSchedulingCompleteIcon(event, element) {
        var completeIcon, workOrder;

        workOrder = getWorkOrder(event);
        if (workOrder && event && event.appointmentId) {

            completeIcon = workOrder.schedulingComplete ?
                "glyphicon glyphicon-ok" :
                "glyphicon glyphicon-option-horizontal";

            completeIcon =
                "<i class=\"" + completeIcon + "\" " +
                "data-action=\"toggleComplete\"></i>";

            completeIcon = $(completeIcon);
            completeIcon.data("appointment-id", event.appointmentId);
            element.find(".fc-time").append(completeIcon);
        }
    }

    function renderRemoveIcon(event, element) {
        var remove;

        if (event.appointmentId) {

            remove = "<span class=\"remove-appointment\">&times;</span>";
            remove = $(remove);
            remove.attr("data-appointment-id", event.appointmentId);

            element.find(".fc-time").prepend(remove);
        }
    }

    function renderTechnicianData(event, techs, element) {
        var parts, tech, template;

        tech = getTechnician(event);

        parts = {};
        template =
            "<div class=\"technicianName\">" +
            "    <strong>Technician:</strong> {name}" +
            "</div>";

        if (tech && techs.length > 1) {
            parts.name = String(tech.name || "").toHtmlString();
            template = template.supplant(parts);
            element.find(".fc-title").before(template);
        }
    }

    function renderTooltip(element) {
        var contentHeight, height;

        // We only get a height later, after rendering is done.
        window.setTimeout(function () {
            contentHeight = element.find(".fc-content").height();
            height = element.height();

            // Sometimes we still don't get a height.  Not sure why.
            // The rendering is called twice, and the first time we don't
            // get a height, but the second time we do.  I dunno.
            if (contentHeight && height && contentHeight > height) {

                // Tooltips are actually handled by jquery-ui's tooltip.
                // See the "initializeTooltips" function below.
                element.attr("data-tooltip", "true");
            }
        }, 10);
    }

    EventRendering.renderEvent = function (event, timeZone, techs, element) {
        renderLateTechnician(event, element);
        renderTechnicianData(event, techs, element);
        renderTimeZoneTable(event, timeZone, element);
        renderSchedulingCompleteIcon(event, element);
        renderRemoveIcon(event, element);
        renderTooltip(element);
    };

    EventRendering.initializeTooltips = function (container) {
        $(container).tooltip({
            content: function () {
                return $(this)
                    .find(".fc-content")
                    .children(":not(.fc-time)")
                    .toArray()
                    .pluck("outerHTML")
                    .join("\n");
            },
            items: "a.fc-event[data-tooltip]",
            tooltipClass: "eventTooltip",
            hide: false,
            position: {
                my: "left bottom",
                at: "center top-5",
                collision: "none"
            }
        });
    };

    return EventRendering;
}());
