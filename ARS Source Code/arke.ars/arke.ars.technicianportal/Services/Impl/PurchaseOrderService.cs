using System;
using System.Security;
using System.Net;
using System.Net.Security;
using System.ServiceModel.Description;
using System.Security.Cryptography.X509Certificates;
using System.Runtime.InteropServices;
using System.Linq;
using System.Web;

using Arke.ARS.CommonWeb.Helpers;
using Arke.ARS.Organization.Context;
using Arke.ARS.TechnicianPortal.Models;

using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Discovery;
using WebGrease.Css.Extensions;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Client;

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
            ClientCredentials credential = new ClientCredentials();
            credential.UserName.UserName = "bjeong@advancedretail.onmicrosoft.com";
            credential.UserName.Password = "bjtjjjaj1029..";
            Guid defaultUnit = new Guid("054ED7A8-A1AE-4D5F-9108-60D387606730");
            Guid defaultUnitGroup = new Guid("682A0D63-FD3D-45DD-8C28-C2F5EB546ACE");
            Guid defaultPriceList = new Guid("2344F7E8-8FD3-E711-810F-E0071B66CFA1");
            Guid productId;
            Guid priceListId;

            // Set the org url
            var organizationURI = "https://advancedretail.crm.dynamics.com/XRMServices/2011/Organization.svc";
            OrganizationServiceProxy svc = new OrganizationServiceProxy(new Uri(organizationURI), null, credential, null);
            svc.EnableProxyTypes();

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

            //long time = DateTime.Now.Ticks;
            //String fileName = Convert.ToString(time);

            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var numbers = "0123456789";
            var stringChars = new char[8];
            var random = new Random();

            for (int i = 0; i < 2; i++)
            {
                stringChars[i] = chars[random.Next(chars.Length)];
            }
            for (int i = 2; i < 6; i++)
            {
                stringChars[i] = numbers[random.Next(numbers.Length)];
            }
            for (int i = 6; i < 8; i++)
            {
                stringChars[i] = chars[random.Next(chars.Length)];
            }

            var fileName = new String(stringChars);

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

                //var item = new SalesOrderDetail
                //// This is not creating a new Order, but rather adding line items to the Order.
                ////This is the difference between the Sales Order and Sales Order Detail.
                //{
                //    PricePerUnit = new Money(orderItem.RealPrice),
                //    ProductDescription = orderItem.Item,
                //    IsPriceOverridden = true,
                //    Quantity = orderItem.Quantity,
                //    SalesOrderId = workOrder.ars_Order,
                //    new_ponumber = fileName,
                //    IsProductOverridden = true,
                //    new_vendor = myOptionSet,
                //    new_storename = store,
                //    new_receipt = receiptBool,
                //    new_Cost = new Money(orderItem.RealPrice),
                //    new_ExtCost = new Money(orderItem.RealPrice*orderItem.Quantity),
                //    new_RetailPrice = new Money(orderItem.beforeTaxPrice),
                //    new_technician = techName,
                //    new_card = cardBool,
                //    new_date = DateTime.Now.ToString(),
                //};

                QueryByAttribute query = new QueryByAttribute("product");
                query.ColumnSet = new ColumnSet("productid", "defaultuomid");
                query.Attributes.AddRange("name");
                query.Values.AddRange(orderItem.Item);
                Entity productent = svc.RetrieveMultiple(query).Entities.ToList().FirstOrDefault();
                if (productent == null)
                {
                    //Entity productent_new = new Entity("product");
                    var newProduct = new Product
                    {                      
                        DefaultUoMId = new EntityReference(UoM.EntityLogicalName, defaultUnit),
                        DefaultUoMScheduleId = new EntityReference(UoMSchedule.EntityLogicalName, defaultUnitGroup),
                        QuantityDecimal = 2,
                        ProductNumber = orderItem.Item,
                        Name = orderItem.Item,
                        Description = orderItem.Item,
                    };

                    productId = svc.Create(newProduct);

                    //Create price list item
                    ProductPriceLevel newPriceListItem = new ProductPriceLevel
                    {
                        PriceLevelId = new EntityReference(PriceLevel.EntityLogicalName, defaultPriceList),
                        ProductId = new EntityReference(Product.EntityLogicalName, productId),
                        UoMId = new EntityReference(UoM.EntityLogicalName, defaultUnit),
                        Amount = new Money(orderItem.RealPrice)
                    };

                    priceListId = svc.Create(newPriceListItem);
                }
                else
                {
                    //Grab ProductId from productent if it is not null
                    productId = (Guid)productent.Attributes["productid"];
                    defaultUnit = ((EntityReference)productent.Attributes["defaultuomid"]).Id;
                }

                //Create SalesOrderDetail
                var item = new SalesOrderDetail
                {
                    PricePerUnit = new Money(orderItem.RealPrice),
                    IsPriceOverridden = true,
                    Quantity = orderItem.Quantity,
                    SalesOrderId = workOrder.ars_Order,
                    new_ponumber = fileName,
                    IsProductOverridden = false,
                    //new_vendor = myOptionSet,
                    //new_storename = store,
                    //new_receipt = receiptBool,
                    new_Cost = new Money(orderItem.RealPrice),
                    new_ExtCost = new Money(orderItem.RealPrice * orderItem.Quantity),
                    new_RetailPrice = new Money(orderItem.beforeTaxPrice),
                    new_technician = techName,
                    //new_card = cardBool,
                    new_date = DateTime.Now.ToString(),
                    ProductId = new EntityReference(Product.EntityLogicalName, productId),
                    UoMId = new EntityReference(UoM.EntityLogicalName, defaultUnit)
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