using System;
using System.Linq;
using System.Web;
using Arke.ARS.CommonWeb.Helpers;
using Arke.ARS.Organization.Context;
using Arke.ARS.TechnicianPortal.Models;
using Microsoft.Xrm.Sdk;
using WebGrease.Css.Extensions;

namespace Arke.ARS.TechnicianPortal.Services.Impl
{
    public sealed class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IArsOrganizationContext _context;
        private readonly ITechnicianService _technicianService;

        public PurchaseOrderService(IArsOrganizationContext context, ITechnicianService technicianService)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (technicianService == null)
            {
                throw new ArgumentNullException("technicianService");
            }

            _context = context;
            _technicianService = technicianService;
        }

        private static void VaildateOrderItem(OrderItemModel orderItem)
        {
            if (orderItem == null)
            {
                throw new ArgumentNullException("orderItem");
            }

            if (String.IsNullOrWhiteSpace(orderItem.Item))
            {
                throw new ArgumentException("Order item description cannot be null or empty");
            }

            if (orderItem.Price < 0)
            {
                throw new ArgumentException(String.Format("Order item {0} price cannot be negative", orderItem.Item));
            }

            if (orderItem.Quantity < 0)
            {
                throw new ArgumentException(String.Format("Order item {0} quantity cannot be negative", orderItem.Item));
            }
        }
            
        public void SubmitPurchaseOrderRequest(Guid workOrderId, Guid technicianId, OrderItemModel[] orderItems, HttpPostedFileBase purchaseOrderReceipt, string vendor, string store)
        {
            if (orderItems == null)
            {
                throw new ArgumentNullException("orderItems");
            }

            orderItems.ForEach(VaildateOrderItem);

            string techName = _technicianService.GetTechnicianName(technicianId);
            var workOrder = _context.IncidentSet.Single(w => w.IncidentId == workOrderId);
            
            //Using ticks as a way to have unique PO #'s
            long time = DateTime.Now.Ticks;
            String fileName = Convert.ToString(time);
            //fileName.Substring(fileName.Length - 15);
            var receiptBool = false;
            if (purchaseOrderReceipt != null)
            {
                receiptBool = true;
            }

                foreach (OrderItemModel orderItem in orderItems)
            {
                OptionSetValue myOptionSet = new OptionSetValue();
                if (vendor == "Visa")
                    myOptionSet.Value = 100000000;
                else if (vendor == "Vendor 2")
                    myOptionSet.Value = 100000001;
                else if (vendor == "Vendor 3")
                    myOptionSet.Value = 100000002;
                else if (vendor == "Vendor 4")
                    myOptionSet.Value = 100000003;
                else if (vendor == "Vendor 5")
                    myOptionSet.Value = 100000004;
                else
                    myOptionSet.Value = 100000000;

                var item1 = new ars_technicianitem
                {
                    ars_Price = new Money(orderItem.Price),
                    ars_description = orderItem.Item,
                    ars_Quantity = orderItem.Quantity,
                    ars_OrderId = workOrder.ars_Order,
                    new_ponumber = fileName
                };

                _context.AddObject(item1);

                var item = new SalesOrderDetail
                {
                    PricePerUnit = new Money(orderItem.RealPrice),
                    ProductDescription = orderItem.Item,
                    Quantity = orderItem.Quantity,
                    SalesOrderId = workOrder.ars_Order,
                    new_ponumber = fileName,
                    IsProductOverridden = true,
                    new_vendor = myOptionSet,
                    new_storename = store,
                    new_receipt = receiptBool,
                    new_cost = new Money(orderItem.RealPrice),
                    new_extcost = new Money(orderItem.RealPrice*orderItem.Quantity)
                };

                _context.AddObject(item);
            }

            if (purchaseOrderReceipt != null)
            {
                var annotation = new Annotation
                {
                    NoteText = String.Format("Purchase order receipt from {0}", techName),
                    ObjectId = workOrder.ars_Order,
                    FileName = purchaseOrderReceipt.GetNonEmptyFileName(),
                    MimeType = purchaseOrderReceipt.ContentType,
                    DocumentBody = purchaseOrderReceipt.ConvertToBase64()
                };

                _context.AddObject(annotation);
            }
            
            _context.SaveChanges();
        }

        public void SubmitTruckEquipment(Guid workOrderId, Guid technicianId, OrderItemModel[] orderItems)
        {
            if (orderItems == null)
            {
                throw new ArgumentNullException("orderItems");
            }

            orderItems.ForEach(VaildateOrderItem);

            string techName = _technicianService.GetTechnicianName(technicianId);
            var workOrder = _context.IncidentSet.Single(w => w.IncidentId == workOrderId);

            foreach (OrderItemModel orderItem in orderItems)
            {
                var item1 = new ars_technicianitem
                {
                    ars_Price = new Money(orderItem.Price),
                    ars_description = orderItem.Item,
                    ars_Quantity = orderItem.Quantity,
                    ars_OrderId = workOrder.ars_Order,
                };

                _context.AddObject(item1);

                var item = new SalesOrderDetail
                {
                    PricePerUnit = new Money(orderItem.RealPrice),
                    //new_markupprice = new Money(orderItem.Price),
                    ProductDescription = orderItem.Item,
                    Quantity = orderItem.Quantity,
                    SalesOrderId = workOrder.ars_Order,
                    IsProductOverridden = true
                };

                _context.AddObject(item);
            }

            _context.SaveChanges();
        }
    }
}