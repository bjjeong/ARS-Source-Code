﻿using System;
using System.Web;
using Arke.ARS.TechnicianPortal.Models;

namespace Arke.ARS.TechnicianPortal.Services
{
    public interface IPurchaseOrderService
    {
        void SubmitPurchaseOrderRequest(Guid workOrderId, Guid technicianId, OrderItemModel[] orderItems, HttpPostedFileBase purchaseOrderReceipt, HttpPostedFileBase purchaseOrderReceipt2, string vendor, string store, string card);
        void SubmitTruckEquipment(Guid workOrderId, Guid technicianId, OrderItemModel[] orderItems);
    }
}