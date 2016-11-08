using System;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Arke.ARS.TechnicianPortal.Models;
using Arke.ARS.TechnicianPortal.Services;
using Microsoft.AspNet.Identity;

namespace Arke.ARS.TechnicianPortal.Controllers
{
    public sealed class WorkOrderController : Controller
    {
        private readonly IWorkOrderService _workOrderService;
        private readonly IPurchaseOrderService _purchaseOrderService;

        public WorkOrderController(IWorkOrderService workOrderService, IPurchaseOrderService purchaseOrderService)
        {
            if (workOrderService == null)
            {
                throw new ArgumentNullException("workOrderService");
            }

            if (purchaseOrderService == null)
            {
                throw new ArgumentNullException("purchaseOrderService");
            }

            _workOrderService = workOrderService;
            _purchaseOrderService = purchaseOrderService;
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
        public RedirectToRouteResult CheckOut(Guid id, StatusCode status, string notes)
        {
            var identity = (ClaimsIdentity)User.Identity;
            var technicianId = Guid.Parse(identity.GetUserId());
            switch (status)
            {
                case StatusCode.TechnicianOffsite:
                    _workOrderService.SetTemporarilyOffSite(id, technicianId, notes);
                    break;
                case StatusCode.ReturnNeedForParts:
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
                case StatusCode.ReturnNeedToQuote:
                    _workOrderService.ReturnRequired(id, notes, status, technicianId);
                    break;
                case StatusCode.WorkComplete:
                    _workOrderService.CompleteWork(id, technicianId, notes);
                    break;
            }
            return RedirectToAction("Index", new { id });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult NteIncrease(NteIncreaseRequestModel nteIncreaseRequest, string item1, string item2, string item3, string item4, string item5, string price1, string price2, string price3, string price4, string price5, string quantity1, string quantity2, string quantity3, string quantity4, string quantity5, string comment)
        {
            if (nteIncreaseRequest == null)
            {
                throw new ArgumentNullException("nteIncreaseRequest");
            }
            var identity = (ClaimsIdentity)User.Identity;
            var technicianId = Guid.Parse(identity.GetUserId());
            _workOrderService.setNteBool(nteIncreaseRequest.WorkOrderId, technicianId);
            _workOrderService.IncreaseNte(nteIncreaseRequest.WorkOrderId,technicianId, nteIncreaseRequest.Money, nteIncreaseRequest.Hours, item1, item2, item3, item4, item5, price1, price2, price3, price4, price5, quantity1, quantity2, quantity3, quantity4, quantity5, comment);
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
        public RedirectToRouteResult SubmitPurchaseOrderRequest(Guid id, OrderItemModel[] orderItems, HttpPostedFileBase purchaseOrderReceipt)
        {
            if (orderItems == null)
            {
                throw new ArgumentNullException("orderItems");
            }

            _purchaseOrderService.SubmitPurchaseOrderRequest(id, GetCurrentTechnicianId(), orderItems, purchaseOrderReceipt);
            return RedirectToAction("Index", new { id });
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