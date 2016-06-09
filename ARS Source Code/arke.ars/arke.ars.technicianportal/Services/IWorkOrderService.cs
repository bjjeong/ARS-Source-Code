using System;
using System.Web;
using Arke.ARS.TechnicianPortal.Models;

namespace Arke.ARS.TechnicianPortal.Services
{
    public interface IWorkOrderService
    {
        WorkOrderModel GetWorkOrder(Guid workOrderId, Guid technicianId);
        string StartProgress(Guid workOrderId, Guid technicianId);
        void SetTemporarilyOffSite(Guid workOrderId, Guid technicianId, string notes);
        void ReturnRequired(Guid workOrderId, string note, StatusCode status, Guid technicianId);
        void CompleteWork(Guid workOrderId, Guid technicianId, string notes);
        void IncreaseNte(Guid orderId, Guid workOrderId, decimal money, decimal hours);
        void AddCommentAndAttachment(Guid workOrderId, Guid technicianId, string comment, HttpPostedFileBase attachment);
        void AddSignature(Guid workOrderId, Guid technicianId, string signature, string printname);
        void SetWorkItemStatus(Guid workItemId, Guid technicianId, bool isComplete, HttpPostedFileBase note);
    }
}
