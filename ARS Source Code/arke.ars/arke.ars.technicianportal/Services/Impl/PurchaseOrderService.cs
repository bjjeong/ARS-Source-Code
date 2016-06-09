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

        public void SubmitPurchaseOrderRequest(Guid workOrderId, Guid technicianId, OrderItemModel[] orderItems, HttpPostedFileBase purchaseOrderReceipt)
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
                var item = new ars_technicianitem
                {
                    ars_Price = new Money(orderItem.Price),
                    ars_description = orderItem.Item,
                    ars_Quantity = orderItem.Quantity,
                    ars_OrderId = workOrder.ars_Order
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
    }
}