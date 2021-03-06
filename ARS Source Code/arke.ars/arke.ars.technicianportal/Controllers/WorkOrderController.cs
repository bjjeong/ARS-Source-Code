﻿using System;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.TechnicianPortal.Models;
using Arke.ARS.TechnicianPortal.Services;
using Microsoft.AspNet.Identity;
using System.Linq;
using System.Diagnostics;

namespace Arke.ARS.TechnicianPortal.Controllers
{
    public sealed class WorkOrderController : Controller
    {
        private readonly IWorkOrderService _workOrderService;
        private readonly IPurchaseOrderService _purchaseOrderService;
        private readonly ILogger _logger;

        public WorkOrderController(IWorkOrderService workOrderService, IPurchaseOrderService purchaseOrderService, ILogger logger)
        {
            if (workOrderService == null)
            {
                throw new ArgumentNullException("workOrderService");
            }

            if (purchaseOrderService == null)
            {
                throw new ArgumentNullException("purchaseOrderService");
            }

            if (logger == null)
            {
                throw new ArgumentNullException("logger");
            }

            _workOrderService = workOrderService;
            _purchaseOrderService = purchaseOrderService;
            _logger = logger;
        }

        public ActionResult Index(Guid id)
        {
            var identity = (ClaimsIdentity)User.Identity;
            var technicianId = Guid.Parse(identity.GetUserId());
            WorkOrderModel model = _workOrderService.GetWorkOrder(id, technicianId);
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult CheckIn(Guid id)
        {
            var identity = (ClaimsIdentity)User.Identity;
            var technicianId = Guid.Parse(identity.GetUserId());
            TempData["ErrorMessage"] = _workOrderService.StartProgress(id, technicianId);
            return RedirectToAction("Index", new { id }); 
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult CheckOut(Guid id, StatusCode status, string notes, string lunch)
        {
            var identity = (ClaimsIdentity)User.Identity;
            var technicianId = Guid.Parse(identity.GetUserId());
            switch (status)
            {
                case StatusCode.TechnicianOffsite:
                    _workOrderService.SetTemporarilyOffSite(id, technicianId, notes);
                    break;
                case StatusCode.ReturnNeedForParts:
                    //_workOrderService.SetWorkItemStatus(id, GetCurrentTechnicianId(), false, note);
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
                case StatusCode.ReturnNeedToQuote:
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
                case StatusCode.WorkComplete:
                    _workOrderService.CompleteWork(id, technicianId, notes, lunch);
                    break;
                case StatusCode.NeedToQuotePlumbing:
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
                case StatusCode.NeedToQuoteElectrical:
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
                case StatusCode.NeedToQuoteGeneral:
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
            }
            return RedirectToAction("Index", new { id }); 
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult NteIncrease(NteIncreaseRequestModel nteIncreaseRequest, string item1, string item2, string item3, string item4, string item5, string item6, string item7, string price1, string price2, string price3, string price4, string price5, string price6, string price7, string quantity1, string quantity2, string quantity3, string quantity4, string quantity5, string quantity6, string quantity7, string comment)
        {
            if (nteIncreaseRequest == null)
            {
                throw new ArgumentNullException("nteIncreaseRequest");
            }
            var identity = (ClaimsIdentity)User.Identity; 
            var technicianId = Guid.Parse(identity.GetUserId());
            _workOrderService.setNteBool(nteIncreaseRequest.WorkOrderId, technicianId);
            _workOrderService.IncreaseNte(nteIncreaseRequest.WorkOrderId,technicianId, nteIncreaseRequest.Money, nteIncreaseRequest.Hours, item1, item2, item3, item4, item5, item6, item7, price1, price2, price3, price4, price5, price6, price7, quantity1, quantity2, quantity3, quantity4, quantity5, quantity6, quantity7, comment);
            return RedirectToAction("Index", new { Id = nteIncreaseRequest.WorkOrderId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult Sign(Guid id, string signature, string printname)
        {
            _workOrderService.AddSignature(id, GetCurrentTechnicianId(), signature, printname);
            return RedirectToAction("Index", new { id }); 
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult AddCommentAndAttachment(Guid id, string comment, HttpPostedFileBase attachment)
        {
            _workOrderService.AddCommentAndAttachment(id, GetCurrentTechnicianId(), comment, attachment);
            return RedirectToAction("Index", new { id });
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult Application(NteIncreaseRequestModel nteIncreaseRequest, string item1, string item2, string item3, string item4, string item5, string item6, string item7, string price1, string price2, string price3, string price4, string price5, string price6, string price7, string quantity1, string quantity2, string quantity3, string quantity4, string quantity5, string quantity6, string quantity7, string comment)
        {
            if (nteIncreaseRequest == null)
            {
                throw new ArgumentNullException("nteIncreaseRequest");
            }
            var identity = (ClaimsIdentity)User.Identity;
            var technicianId = Guid.Parse(identity.GetUserId());
            _workOrderService.setNteBool(nteIncreaseRequest.WorkOrderId, technicianId);
            _workOrderService.IncreaseNte(nteIncreaseRequest.WorkOrderId, technicianId, nteIncreaseRequest.Money, nteIncreaseRequest.Hours, item1, item2, item3, item4, item5, item6, item7, price1, price2, price3, price4, price5, price6, price7, quantity1, quantity2, quantity3, quantity4, quantity5, quantity6, quantity7, comment);
            return RedirectToAction("Index", new { Id = nteIncreaseRequest.WorkOrderId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult SubmitPurchaseOrderRequest(Guid id, OrderItemModel[] orderItems, HttpPostedFileBase purchaseOrderReceipt, HttpPostedFileBase purchaseOrderReceipt2, string vendor, string store, string card)
        {
            if (orderItems == null)
            {
                throw new ArgumentNullException("orderItems"); 
            }

            _purchaseOrderService.SubmitPurchaseOrderRequest(id, GetCurrentTechnicianId(), orderItems, purchaseOrderReceipt, purchaseOrderReceipt2, vendor, store, card);
            return RedirectToAction("Index", new { id });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult SubmitTruckEquipment(Guid id, OrderItemModel[] orderItems)
        {
            if (orderItems == null)
            {
                throw new ArgumentNullException("orderItems"); 
            }

            _purchaseOrderService.SubmitTruckEquipment(id, GetCurrentTechnicianId(), orderItems);
            return RedirectToAction("Index", new { id });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Add(ApplicationModel model)
        {
            if (ModelState.IsValid)
            {
                _workOrderService.AddApplication(model);
            }
            else
            {
                _logger.LogException("Invalid model state", ModelState.SelectMany(x => x.Value.Errors.Select(z => z.Exception)).First());
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult SetWorkItemStatus(Guid id, bool? isComplete, HttpPostedFileBase note)
        {
            _workOrderService.SetWorkItemStatus(id, GetCurrentTechnicianId(), isComplete == true, note);
            return new EmptyResult();
        }

        private Guid GetCurrentTechnicianId()
        {
            var identity = (ClaimsIdentity)User.Identity;
            Guid technicianId = Guid.Parse(identity.GetUserId());
            return technicianId;
        }
    }
}