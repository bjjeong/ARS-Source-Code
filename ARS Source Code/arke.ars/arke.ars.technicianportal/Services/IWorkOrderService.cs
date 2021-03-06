﻿using System;
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
        void CompleteWork(Guid workOrderId, Guid technicianId, string notes, string lunch);
        void IncreaseNte(Guid orderId, Guid workOrderId, decimal money, decimal hours, string item1, string item2, string item3, string item4, string item5, string item6, string item7, string price1, string price2, string price3, string price4, string price5, string price6, string price7, string quantity1, string quantity2, string quantity3, string quantity4, string quantity5, string quantity6, string quantity7, string comment);
        void AddCommentAndAttachment(Guid workOrderId, Guid technicianId, string comment, HttpPostedFileBase attachment);
        void AddSignature(Guid workOrderId, Guid technicianId, string signature, string printname);
        void SetWorkItemStatus(Guid workItemId, Guid technicianId, bool isComplete, HttpPostedFileBase note);
        void setNteBool(Guid workOrderId, Guid technicianId);
        void AddApplication(ApplicationModel model);
        WorkOrderModel GetWorkOrderDetails(Guid workOrderId);
    }
}
