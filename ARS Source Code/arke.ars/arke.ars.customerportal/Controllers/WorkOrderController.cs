﻿using System;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.CustomerPortal.Models;
using Arke.ARS.CustomerPortal.Services;
using Microsoft.AspNet.Identity;
using PagedList;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.ServiceModel.Description;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Xrm.Client;
using Microsoft.Xrm.Client.Services;

namespace Arke.ARS.CustomerPortal.Controllers
{
    public sealed class WorkOrderController : Controller
    {
        private readonly IWorkOrderService _workOrderService;
        private readonly ILocationService _locationService;
        private readonly ILogger _logger;

        public WorkOrderController(IWorkOrderService workOrderService, ILocationService locationService, ILogger logger)
        {
            if (workOrderService == null)
            {
                throw new ArgumentNullException("workOrderService");
            }


            if (locationService == null)
            {
                throw new ArgumentNullException("locationService");
            }

            if (logger == null)
            {
                throw new ArgumentNullException("logger");
            }

            _workOrderService = workOrderService;
            _locationService = locationService; 
            _logger = logger;
        }

        public ActionResult Index(QueryModel oq, QueryModel cq, bool? showOpen)
        {
            Guid customerId = GetCurrentCustomerId();

            IPagedList<ClosedWorkOrderModel> closedOrders = _workOrderService.GetClosedWorkOrdersModels(cq, customerId);
            IPagedList<OpenWorkOrderModel> openOrders = _workOrderService.GetOpenWorkOrdersModels(oq, customerId);
            IPagedList<ScheduledWorkOrderModel> scheduledOrders = _workOrderService.GetScheduledWorkOrdersModels(oq, customerId);
            IPagedList<QuoteApprovalWorkOrderModel> quoteApprovalOrders = _workOrderService.GetQuoteApprovalWorkOrdersModels(oq, customerId);

            var locationItems = _locationService.GetLocations(customerId).Select(l => new SelectListItem
            {
                Value = l.Id.ToString(),
                Text = l.Name
            }).ToList();
            locationItems.Insert(0, new SelectListItem());

            var model = new CustomerPortalModel(Url)
            {
                OpenOrders = openOrders,
                ClosedOrders = closedOrders,
                ScheduledOrders = scheduledOrders,
                QuoteApprovalOrders = quoteApprovalOrders,
                ShowOpen = showOpen ?? true,
                Locations = locationItems,
                ClosedWorkOrdersQuery = cq,
                OpenWorkOrdersQuery = oq,
                ScheduledWOrkOrdersQuery = oq,
                QuoteApprovalWorkOrdersQuery = oq,
            };

            TempData["ReturnToListUrl"] = Request.RawUrl;
            return View(model);
        }

        public ActionResult Details(Guid id)
        {
            WorkOrderDetailsModel model = _workOrderService.GetWorkOrderDetails(id);

            ViewData["ReturnToListUrl"] = TempData.ContainsKey("ReturnToListUrl")
                ? TempData["ReturnToListUrl"]
                : Url.Action("Index");
            return View(model);
        }

        public ActionResult Location(Guid id, QueryModel oq, QueryModel cq, bool? showOpen)
        {
            IPagedList<ClosedWorkOrderModel> closedOrders = _workOrderService.GetLocationClosedWorkOrdersModels(cq, id);
            IPagedList<OpenWorkOrderModel> openOrders = _workOrderService.GetLocationOpenWorkOrdersModels(oq, id);
            LocationAddressModel location = _workOrderService.GetLocationInfo(id);
            LocationInfoModel locationInfo = _workOrderService.GetSpecificLocationInfo(id);

            var locationItems = _locationService.GetSingleLocation(id).Select(l => new SelectListItem
            {
                Value = l.Id.ToString(),
                Text = l.Name
            }).ToList();
            locationItems.Insert(0, new SelectListItem());

            var model = new LocationDetailsModel(Url)
            {
                LocationOpenOrders = openOrders,
                LocationClosedOrders = closedOrders,
                ShowOpen = showOpen ?? true,
                Locations = locationItems,
                ClosedWorkOrdersQuery = cq,
                OpenWorkOrdersQuery = oq,
                Address1 = location.Address1,
                Address2 = location.Address2,
                City = location.City,
                State = location.State,
                PostalCode = location.PostalCode, 
                Name = location.Name,
                LocationInfo = locationInfo,
                LocationAddress = location
            };

            ViewData["ReturnToListUrl"] = TempData.ContainsKey("ReturnToListUrl")
                ? TempData["ReturnToListUrl"]
                : Url.Action("Index");
            return View(model);
        }

        public void Cancel(Guid orderId)
        {
            _workOrderService.CancelWorkOrder(orderId);
        }

        public void Reopen(Guid orderId)
        {
            _workOrderService.ReopenWorkOrder(orderId);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult AddLocationComment(Guid id, string comment)
        {
            _locationService.AddLocationNotes(id, comment);
            return RedirectToAction("Location", new { id });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Add(NewWorkOrderModel model)
        {
            if (ModelState.IsValid)
            {
                _workOrderService.AddWorkOrder(model, GetCurrentCustomerId());
            }
            else
            {
                _logger.LogException("Invalid model state", ModelState.SelectMany(x => x.Value.Errors.Select(z => z.Exception)).First());
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult AddComment(Guid workOrderId, string comment, HttpPostedFileBase attachment)
        {
            _workOrderService.AddComment(workOrderId, GetCurrentCustomerId(), comment, attachment);
            return RedirectToAction("Details", new { id = workOrderId });
        }

        private Guid GetCurrentCustomerId()
        {
            var identity = (ClaimsIdentity)User.Identity;
            Guid customerId = Guid.Parse(identity.GetUserId());
            return customerId;
        }
    }
}
