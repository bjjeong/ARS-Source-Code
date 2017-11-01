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
            
        public void SubmitPurchaseOrderRequest(Guid workOrderId, Guid technicianId, OrderItemModel[] orderItems, HttpPostedFileBase purchaseOrderReceipt, HttpPostedFileBase purchaseOrderReceipt2, string vendor, string store, string card)
        {
            if (orderItems == null)
            {
                throw new ArgumentNullException("orderItems");
            }

            orderItems.ForEach(VaildateOrderItem);

            string techName = _technicianService.GetTechnicianName(technicianId);
            var workOrder = _context.IncidentSet.Single(w => w.IncidentId == workOrderId);
            
            
            //Using ticks as a way to have unique PO #'s. This does not "guarantee" a different number
            //in the case that two work orders are created at the EXACT same time, but the chance that 
            //happens is miniscule.
            long time = DateTime.Now.Ticks;
            String fileName = Convert.ToString(time);
            
             //fileName.Substring(fileName.Length - 15); This is an attempt to make that PO # shorter. However, this might create the problem of collisions in the future. No guarantees for unique ID's. 
            //We will keep it at current length for now. If we really need to shorten it, we can later. 
            //For new STD system we probably still need this feature. But a lot of the features in the technician portal can be removed.
            var receiptBool = false;
            if ((purchaseOrderReceipt != null) || (purchaseOrderReceipt2 != null))
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

                OptionSetValue cardBool = new OptionSetValue();
                if (card == "Yes")
                    cardBool.Value = 100000000;
                else
                    cardBool.Value = 100000001;

                var item1 = new ars_technicianitem
                {
                    ars_Price = new Money(orderItem.Price),
                    ars_description = orderItem.Item,
                    ars_Quantity = orderItem.Quantity,
                    ars_OrderId = workOrder.ars_Order,
                    new_PONumber = fileName
                };

                _context.AddObject(item1);

                var item = new SalesOrderDetail
                // This is not creating a new Order, but rather adding line items to the Order.
                //This is the difference between the Sales Order and Sales Order Detail.
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
                    new_Cost = new Money(orderItem.RealPrice),
                    new_ExtCost = new Money(orderItem.RealPrice*orderItem.Quantity),
                    new_RetailPrice = new Money(orderItem.beforeTaxPrice),
                    new_technician = techName,
                    new_card = cardBool,
                    new_date = DateTime.Now.ToString()
                };

                //var invoice = new InvoiceDetail
                ////This is not creating a new invoice, but rather adding a line item to the invoice.
                ////This is the difference between the InvoiceDetail and Invoice
                
                // This isn't working cause the invoice has not yet been created. That's why I can't grab
                // the invoice ID               

                //{
                //    Quantity = orderItem.Quantity,
                //    InvoiceId = workOrder.new_invoice,
                //    PricePerUnit = new Money(orderItem.RealPrice),
                //    ProductDescription = orderItem.Item,
                //    new_PO = fileName,
                //    new_RetailPrice = new Money(orderItem.beforeTaxPrice),
                //    new_StoreName = store,
                //    new_Technician = techName
                //};

                _context.AddObject(item);
                //_context.AddObject(invoice);
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

            if (purchaseOrderReceipt2 != null)
            {
                var annotation = new Annotation
                {
                    NoteText = String.Format("Purchase order receipt from {0}", techName),
                    ObjectId = workOrder.ars_Order,
                    FileName = purchaseOrderReceipt2.GetNonEmptyFileName(),
                    MimeType = purchaseOrderReceipt2.ContentType,
                    DocumentBody = purchaseOrderReceipt2.ConvertToBase64()
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
                    IsProductOverridden = true,
                    new_ponumber = "Truck Stock"
                };

                _context.AddObject(item);
            }

            _context.SaveChanges();
        }
    }
}