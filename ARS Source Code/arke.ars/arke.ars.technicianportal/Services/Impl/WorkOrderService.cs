using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Arke.ARS.CommonWeb.Helpers;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.Organization.Context;
using Arke.ARS.TechnicianPortal.Infrastructure;
using Arke.ARS.TechnicianPortal.Models;
using Arke.Crm.Utils.Helpers;
using Arke.Crm.Utils.Infrastructure.OptionSet;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Client;
using System.Diagnostics;

namespace Arke.ARS.TechnicianPortal.Services.Impl
{
    public sealed class WorkOrderService : IWorkOrderService
    {
        private readonly IArsOrganizationContext _context;
        private readonly ITechnicianService _technicianService;
        private readonly IOptionSetHelper _optionSetHelper;
        private static string _productDescription;
        private readonly ILogger _logger;

        public WorkOrderService(IArsOrganizationContext context, ITechnicianService technicianService, IOptionSetHelper optionSetHelper, ILogger logger)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (technicianService == null)
            {
                throw new ArgumentNullException("technicianService");
            }

            if (optionSetHelper == null)
            {
                throw new ArgumentNullException("optionSetHelper");
            }

            if (logger == null)
            {
                throw new ArgumentNullException("logger");
            }

            _context = context;
            _technicianService = technicianService;
            _optionSetHelper = optionSetHelper;
            _logger = logger;
        }

        public void AddApplication(ApplicationModel model)
        {
            Debug.Print("Entered WorkOrderServices.cs AddApplication function");
            var application = new new_applications
            {
                new_ContactFirstName = model.ContactFirstName,
                new_ContactLastName = model.ContactLastName,
                new_Email = model.Email,
                new_name = model.CompanyName,
                new_Phone = model.Phone,
                new_StreetAddress = model.StreetAddress,
                new_City = model.City,
                new_State = model.State,
                new_CompanyWebsite = model.Website,
                new_IVR = model.IVR,
                new_EmergencyService = model.Emergency,
                new_BeforeAfterPhotos = model.Photos,
                new_ServiceArea = model.ServiceArea
            };

            _context.AddObject(application);
            _context.SaveChanges();
        }

        public WorkOrderModel GetWorkOrder(Guid workOrderId, Guid technicianId)
        {
            if (workOrderId == null)
            {
                throw new ArgumentNullException("workOrderId");
            }
            _logger.LogInfo("getting order with id {0}", workOrderId);
            var workOrder = _context.IncidentSet.Single(i => i.IncidentId == workOrderId);
            var customer = new CustomerModel();

            if (workOrder.ars_Location != null)
            {
                customer = (from account in _context.AccountSet
                            where account.AccountId == workOrder.ars_Location.Id
                            select new CustomerModel
                            {
                                CustomerName = account.Name,
                                AddressLine1 = account.Address1_Line1,
                                City = account.Address1_City,
                                State = account.Address1_StateOrProvince,
                                PostalCode = account.Address1_PostalCode,
                                Country = account.Address1_Country,
                                Telephone = account.Address1_Telephone2 != null ? account.Address1_Telephone2 : "N/A",
                                Composite = account.Address1_Composite,
                                IVR = account.new_IVR != null ? account.new_IVR : "N/A",
                                Pin = account.new_pinNumber != null ? account.new_pinNumber : "N/A",
                            }).First();
                _logger.LogInfo("customer name {0}", customer.CustomerName);
            }

            Dictionary<string, int> workItemStatuses = GetWorkItemStatuses();
            var workItems = (from workItem in _context.ars_workitemSet
                             where workItem.ars_WorkOrderId.Id == workOrderId
                             select new WorkItemModel
                             {
                                 Id = workItem.Id,
                                 IsComplete = workItem.statuscode.Value == workItemStatuses["Complete"],
                                 Name = workItem.ars_name
                             }).ToArray();
            _logger.LogInfo("workItemStatuses contains {0}", workItemStatuses.Keys.Count);
            var checkInKey = GetEventTypeValue(EventType.CheckIn).Key;
            var checkOutKey = GetEventTypeValue(EventType.CheckOut).Key;
            bool isInProgress;
            var events = _context.ars_workordereventSet
                .Where(e => e.ars_WorkOrder.Id == workOrderId)
                .Where(e => e.ars_Technician.Id == technicianId)
                .Where(e => e.ars_EventType.Value == checkInKey || e.ars_EventType.Value == checkOutKey)
                .OrderByDescending(e => e.CreatedOn)
                .FirstOrDefault();

            if (events == null || events.ars_EventType.Value == checkOutKey)
            {
                isInProgress = false;
            }
            else
            {
                isInProgress = true;
            }

            var activities = (from activity in _context.ars_workitemSet
                              join annotation in _context.AnnotationSet on activity.ars_workitemId equals annotation.ObjectId.Id
                              into attachments
                              from attachment in attachments.DefaultIfEmpty()
                              where activity.ars_WorkOrderId.Id == workOrderId
                              select new
                              {
                                  AttachmentId = attachment.AnnotationId,
                                  AttachmentFileName = attachment.FileName,
                                  CreatedOn = activity.CreatedOn.Value,
                                  Description = activity.ars_name,
                                  Id = activity.ars_workitemId.Value
                              }).ToArray();


            var activiteList = new List<ActivityModel>(activities.Length);
            foreach (var activityGroup in activities.GroupBy(a => a.Id))
            {
                var activityModel = new ActivityModel
                {
                    Id = activityGroup.Key
                };

                var attachments = new List<AttachmentModel>();
                int index = 1;

                foreach (var activity in activityGroup)
                {
                    activityModel.CreatedOn = activity.CreatedOn;
                    activityModel.Description = activity.Description;

                    if (activity.AttachmentId.HasValue)
                    {
                        attachments.Add(new AttachmentModel
                        {
                            FileName = activity.AttachmentFileName ?? "Attachment #" + index,
                            Id = activity.AttachmentId.Value
                        });

                        index++;
                    }
                }

                activityModel.Attachments = attachments.ToArray();
                activiteList.Add(activityModel);
            }

                return new WorkOrderModel
            {
                Id = workOrder.Id,
                Title = workOrder.Title,
                TicketNumber = workOrder.TicketNumber,
                Description = workOrder.Description,
                IsInProgress = isInProgress,
                RemainingHours = workOrder.ars_NTERemainingHours.GetValueOrDefault(),
                NteHours = workOrder.ars_NTETotalHours.GetValueOrDefault(),
                RemainingMoney = workOrder.ars_NTERemainingMoney != null ? workOrder.ars_NTERemainingMoney.Value : 0,
                NteMoney = workOrder.new_NotToExceedNTE != null ? workOrder.new_NotToExceedNTE.Value : 0,
                Customer = customer,
                WorkItems = workItems,
                trade = workOrder.new_trade,
                po = workOrder.new_PO,
                Activities = activiteList.OrderByDescending(a => a.CreatedOn).ToArray()
            };
        }

        public string GetoptionsetText(string entityName, string attributeName, int optionSetValue, IOrganizationService service)
        {
            string AttributeName = attributeName;
            string EntityLogicalName = entityName;
            RetrieveEntityRequest retrieveDetails = new RetrieveEntityRequest
            {
                EntityFilters = EntityFilters.All,
                LogicalName = EntityLogicalName
            }; 
            RetrieveEntityResponse retrieveEntityResponseObj = (RetrieveEntityResponse)service.Execute(retrieveDetails);
            Microsoft.Xrm.Sdk.Metadata.EntityMetadata metadata = retrieveEntityResponseObj.EntityMetadata;
            Microsoft.Xrm.Sdk.Metadata.PicklistAttributeMetadata picklistMetadata = metadata.Attributes.FirstOrDefault(attribute => String.Equals(attribute.LogicalName, attributeName, StringComparison.OrdinalIgnoreCase)) as Microsoft.Xrm.Sdk.Metadata.PicklistAttributeMetadata;
            Microsoft.Xrm.Sdk.Metadata.OptionSetMetadata options = picklistMetadata.OptionSet;
            IList<OptionMetadata> OptionsList = (from o in options.Options
                                                 where o.Value.Value == optionSetValue
                                                 select o).ToList();
            string optionsetLabel = (OptionsList.First()).Label.UserLocalizedLabel.Label;
            return optionsetLabel;
        }

        public string StartProgress(Guid workOrderId, Guid technicianId)
        {
            var workOrder = _context.IncidentSet.Single(i => i.IncidentId == workOrderId);
            var technician = _context.ars_technicianSet.Single(t => t.ars_technicianId == technicianId);
            ChangeWorkOrdersStatus(workOrder, technician, StatusCode.InProgress, EventType.CheckIn);

            if (workOrder.ars_Order == null)
            {
                var errorMessage = string.Format("Work order with Id: {0} has no Order. Please contact administrator", workOrderId);
                _logger.LogWarning(errorMessage);
                _context.SaveChanges();
                return "Current work order  has no Order. Please contact administrator.";
            }
            else
            {
                var salesOrder = _context.SalesOrderSet.SingleOrDefault(s => s.SalesOrderId == workOrder.ars_Order.Id);
                if (salesOrder == null)
                {
                    throw new Exception("Current workflow is not connected to the order");
                }

                _productDescription = "Trip Charge";
                var details = _context
                    .SalesOrderDetailSet.Where(s => s.SalesOrderId.Id == salesOrder.SalesOrderId)
                    .Where(s => s.ProductDescription == _productDescription)
                    .ToList();
                var today = details.Where(d => ((DateTime) d.CreatedOn).Date == DateTime.Today)
                    .ToList();

                if (!today.Any())
                {
                    var product = new SalesOrderDetail
                    {
                        ProductDescription = _productDescription,
                        SalesOrderId = salesOrder.ToEntityReference(),
                        Quantity = 1,
                        PricePerUnit = workOrder.ars_TripRate,
                        IsProductOverridden = true
                    };
                    _context.AddObject(product);
                }

                //Check if labor charge is already in the Product list
                _productDescription = "Labor Charge";
                var laborDetails = _context
                    .SalesOrderDetailSet.Where(s => s.SalesOrderId.Id == salesOrder.SalesOrderId)
                    .Where(s => s.ProductDescription == _productDescription)
                    .ToList();

                //If labor charge is not yet in the list, add it
                if (!laborDetails.Any())
                {
                    var labor = new SalesOrderDetail
                    {
                        ProductDescription = _productDescription,
                        SalesOrderId = salesOrder.ToEntityReference(),
                        Quantity = 1,
                        PricePerUnit = workOrder.ars_LaborRate,
                        IsProductOverridden = true
                    };
                    _context.AddObject(labor);
                }

                _context.SaveChanges();
                return null;
            }
        }

        public void SetTemporarilyOffSite(Guid workOrderId, Guid technicianId, string note)
        {
            var workOrder = _context.IncidentSet.Single(i => i.IncidentId == workOrderId);
            var technician = _context.ars_technicianSet.Single(t => t.ars_technicianId == technicianId);
            ChangeWorkOrdersStatus(workOrder, technician, StatusCode.TechnicianOffsite, EventType.CheckOut);
            AddNote(technicianId, workOrder, note);
            _context.SaveChanges();
        }

        public void setNteBool(Guid workOrderId, Guid technicianId)
        {
            var workOrder = _context.IncidentSet.Single(i => i.IncidentId == workOrderId);
            workOrder["new_nteincrease"] = true;
            _context.UpdateObject(workOrder);
            _context.SaveChanges();
        }

        public void ReturnRequired(Guid workOrderId, string note, StatusCode statusCode, Guid technicianId)
        {
            if (workOrderId == null)
            {
                throw new ArgumentNullException("workOrderId");
            }

            var workOrder = _context.IncidentSet.Single(i => i.IncidentId == workOrderId);
            var technician = _context.ars_technicianSet.Single(t => t.ars_technicianId == technicianId);
            ChangeWorkOrdersStatus(workOrder, technician, statusCode, EventType.CheckOut);
            AddNote(technicianId, workOrder, note);
            _context.SaveChanges();
        }

        private void AddNote(Guid technicianId, Incident workOrder, string note)
        {
            if (string.IsNullOrWhiteSpace(note))
            {
                return;
            }
            var technician = _context.ars_technicianSet.Single(t => t.ars_technicianId == technicianId);
            var annotation = new Annotation
            {
                NoteText = string.Format("Technician Note by {0} {1} - {2}", technician.ars_FirstName, technician.ars_LastName, note),
                Incident_Annotation = workOrder
            };

            _context.AddObject(annotation);
        }

        public void CompleteWork(Guid workOrderId, Guid technicianId, string notes, string lunch)
        {
            Dictionary<string, int> workItemStatuses = GetWorkItemStatuses(); 
            bool hasIncompleteWorkItems =
                (from item in _context.ars_workitemSet
                 where item.ars_WorkOrderId.Id == workOrderId && item.statuscode.Value == workItemStatuses["Incomplete"]
                 select item.ars_workitemId)
                    .FirstOrDefault()
                    .HasValue;

            if (hasIncompleteWorkItems)
            {
                throw new Exception("All Work Items must be completed before marking this job as complete.");
            }
            var workOrder = _context.IncidentSet.Single(i => i.IncidentId == workOrderId);
            var technician = _context.ars_technicianSet.Single(t => t.ars_technicianId == technicianId);
            ChangeWorkOrdersStatus(workOrder, technician, StatusCode.WorkComplete, EventType.CheckOut);
            AddNote(technicianId, workOrder, notes);
            workOrder.new_lunch = lunch;


            var eventTypecode = GetEventTypeValue(EventType.Lunch);

            var workorderevent = new ars_workorderevent
            {
                ars_name = String.Format("Lunch"),
                ars_DateTime = DateTime.UtcNow,
                ars_WorkOrder = workOrder.ToEntityReference(),
                ars_Technician = technician.ToEntityReference(),
                ars_Hours = Decimal.Parse(lunch),
                ars_EventType = new OptionSetValue
                {
                    Value = Convert.ToInt32(eventTypecode.Key)
                },
            };

            _context.AddObject(workorderevent);

            _context.UpdateObject(workOrder);
            _context.SaveChanges();


            _context.SaveChanges();
        }

        public void IncreaseNte(Guid workOrderId, Guid technicianId, decimal money, decimal hours, string item1, string item2, string item3, string item4, string item5, string item6, string item7, string price1, string price2, string price3, string price4, string price5, string price6, string price7, string quantity1, string quantity2, string quantity3, string quantity4, string quantity5, string quantity6, string quantity7, string comment)
        {
            if (money < 0)
            {
                throw new ArgumentOutOfRangeException("money", money, "Money could not be negative");
            }

            if (hours < 0)
            {
                throw new ArgumentOutOfRangeException("hours", hours, "Hours could not be negative");
            }

            Incident workOrder = _context.IncidentSet.First(i => i.Id == workOrderId);

            var technician = _context.ars_technicianSet.Single(t => t.ars_technicianId == technicianId);
            //CreateWorkOrderEventOnNteIncrease(workOrder, technician, money, hours);

/*            var annotation = new Annotation
            {
                NoteText = String.Format("NTE Increase Request: {20} hours requested{25}{19}Name:   {0}   Price: {1}   Quantity: {2}{3}Name:   {4}   Price: {5}   Quantity: {6}{7}Name:   {8}   Price: {9}   Quantity: {10}{11}Name:   {12}   Price: {13}   Quantity: {14}{15}Name:   {16}   Price: {17}   Quantity: {18}{21}{24}Comments:{22}{23}", item1, price1, quantity1, Environment.NewLine, item2, price2, quantity2, Environment.NewLine, item3, price3, quantity3, Environment.NewLine, item4, price4, quantity4, Environment.NewLine, item5, price5, quantity5, Environment.NewLine, hours, Environment.NewLine, Environment.NewLine, comment, Environment.NewLine, Environment.NewLine),
                ObjectId = new EntityReference(Incident.EntityLogicalName, workOrderId)
            };
*/
            var eventTypecode = GetEventTypeValue(EventType.NteIncreaseRequest);

            var workorderevent = new ars_workorderevent
            {
                ars_name = String.Format("{0} - NTE Increase Request", workOrder.Title),
                ars_DateTime = DateTime.UtcNow,
                ars_WorkOrder = workOrder.ToEntityReference(),
                ars_Technician = technician.ToEntityReference(),
                ars_EventType = new OptionSetValue
                { 
                    Value = Convert.ToInt32(eventTypecode.Key)
                }, 
                ars_Amount = new Money(money),
                ars_Hours = hours,
                new_description = String.Format("NTE Increase Request: {20} hours requested{25}{19}NAME:   {0}   PRICE: ${1}   QUANTITY: {2}{3}NAME:   {4}   PRICE: ${5}   QUANTITY: {6}{7}NAME:   {8}   PRICE: ${9}   QUANTITY: {10}{11}NAME:   {12}   PRICE: ${13}   QUANTITY: {14}{15}NAME:   {16}   PRICE: ${17}   QUANTITY: {18}{21}NAME:  {26}    PRICE: ${27}    QUANTITY: {28}{29}NAME: {30}    PRICE: ${31}    QUANTITY:   {32}{33}{24}Comments:{22}{23}", item1, price1, quantity1, Environment.NewLine, item2, price2, quantity2, Environment.NewLine, item3, price3, quantity3, Environment.NewLine, item4, price4, quantity4, Environment.NewLine, item5, price5, quantity5, Environment.NewLine, hours, Environment.NewLine, Environment.NewLine, comment, Environment.NewLine, Environment.NewLine, item6, price6, quantity6, Environment.NewLine, item7, price7, quantity7, Environment.NewLine)
            };

            _context.AddObject(workorderevent);

            //_context.AddObject(annotation);
            _context.UpdateObject(workOrder);
            _context.SaveChanges();
        }

        public void AddCommentAndAttachment(Guid workOrderId, Guid technicianId, string comment, HttpPostedFileBase attachment)
        {
            bool hasAttachment = attachment != null && attachment.ContentLength > 0;

            if (String.IsNullOrWhiteSpace(comment) && !hasAttachment)
            {
                return;
            }

            string techName = _technicianService.GetTechnicianName(technicianId);

            var annotation = new Annotation
            {
                NoteText = String.IsNullOrWhiteSpace(comment) ? techName : String.Format("{0} - {1}", techName, comment),
                ObjectId = new EntityReference(Incident.EntityLogicalName, workOrderId)
            };

            if (hasAttachment)
            {
                annotation.FileName = attachment.GetNonEmptyFileName();
                annotation.DocumentBody = attachment.ConvertToBase64();
            }

            _context.AddObject(annotation);
            _context.SaveChanges();
        }

        public void AddSignature(Guid workOrderId, Guid technicianId, string signature, string printname)
        {
            if (String.IsNullOrWhiteSpace(signature))
            {
                throw new ArgumentNullException("signature");
            }

            string techName = _technicianService.GetTechnicianName(technicianId);

            var annotation = new Annotation
            {
                NoteText = String.IsNullOrWhiteSpace(printname) ? techName : String.Format("{0} - Signature from: {1}", techName, printname),
                ObjectId = new EntityReference(Incident.EntityLogicalName, workOrderId),
                FileName = "Signature.png",
                MimeType = "image/png",
                DocumentBody = signature
            };

            _context.AddObject(annotation);
            _context.SaveChanges();
        }

        public void SetWorkItemStatus(Guid workItemId, Guid technicianId, bool isComplete, HttpPostedFileBase note)
        {
            bool hasAttachment = note != null && note.ContentLength > 0;
            Dictionary<string, int> workItemStatuses = GetWorkItemStatuses();

            _context.Execute(new SetStateRequest
            {
                EntityMoniker = new EntityReference(ars_workitem.EntityLogicalName, workItemId),
                State = new OptionSetValue((int)(isComplete ? ars_workitemState.Inactive : ars_workitemState.Active)),
                Status = new OptionSetValue(workItemStatuses[isComplete ? "Complete" : "Incomplete"])
            });

            if (hasAttachment)
            {
                string techName = _technicianService.GetTechnicianName(technicianId);

                var annotation = new Annotation
                {
                    NoteText = String.Format("{0} changed status of work item to '{1}'", techName, isComplete ? "Complete" : "Incomplete"),
                    ObjectId = new EntityReference(ars_workitem.EntityLogicalName, workItemId),
                    FileName = note.GetNonEmptyFileName(),
                    DocumentBody = note.ConvertToBase64()
                };

                _context.AddObject(annotation);
                _context.SaveChanges();
            }
        }

        public WorkOrderModel GetWorkOrderDetails(Guid workOrderId)
        {
            Incident workOrder = _context.IncidentSet.First(i => i.Id == workOrderId);

            var activities = (from activity in _context.ars_workordernoteSet
                              join annotation in _context.AnnotationSet on activity.ars_workordernoteId equals annotation.ObjectId.Id
                              into attachments
                              from attachment in attachments.DefaultIfEmpty()
                              where activity.ars_WorkOrderId.Id == workOrderId
                              select new
                              {
                                  AttachmentId = attachment.AnnotationId,
                                  AttachmentFileName = attachment.FileName,
                                  CreatedOn = activity.CreatedOn.Value,
                                  Description = activity.ars_NoteText,
                                  Id = activity.ars_workordernoteId.Value
                              }).ToArray();


            var activiteList = new List<ActivityModel>(activities.Length);
            foreach (var activityGroup in activities.GroupBy(a => a.Id))
            {
                var activityModel = new ActivityModel
                {
                    Id = activityGroup.Key
                };

                var attachments = new List<AttachmentModel>();
                int index = 1;

                foreach (var activity in activityGroup)
                {
                    activityModel.CreatedOn = activity.CreatedOn;
                    activityModel.Description = activity.Description;

                    if (activity.AttachmentId.HasValue)
                    {
                        attachments.Add(new AttachmentModel
                        {
                            FileName = activity.AttachmentFileName ?? "Attachment #" + index,
                            Id = activity.AttachmentId.Value
                        });

                        index++;
                    }
                }

                activityModel.Attachments = attachments.ToArray();
                activiteList.Add(activityModel);
            }

            Dictionary<int, string> orderStatuses = GetOrderStatuses();
            var orders = (from order in _context.SalesOrderSet
                          where order.ars_WorkOrderId.Id == workOrderId
                          select new OrderModel
                          {
                              Amount = order.TotalAmount.Value,
                              CreatedOn = order.CreatedOn.Value,
                              Id = order.Id,
                              Name = order.Name,
                              Status = orderStatuses[order.StatusCode.Value]
                          }).ToArray();

            return new WorkOrderModel
            {
                Activities = activiteList.OrderByDescending(a => a.CreatedOn).ToArray(),
                Orders = orders
            };
        }

        private void ChangeWorkOrdersStatus(Incident workOrder, ars_technician technician, StatusCode statusCode, EventType eventType)
        {
            var status = GetStatusOptionSetValue(statusCode);
            workOrder.StatusCode = new OptionSetValue
            {
                Value = Convert.ToInt32(status.Key)
            };

            _context.UpdateObject(workOrder);

            CreateWorkOrderEventOnChange(workOrder, technician, eventType, status);
        }

        private void CreateWorkOrderEventOnChange(Incident workOrder, ars_technician technician, EventType eventType, KeyValuePair<int, string> status)
        {
            var eventTypecode = GetEventTypeValue(eventType);
            var previouscode = GetEventTypeValue(eventType == EventType.CheckIn ? EventType.CheckOut : EventType.CheckIn);
            var events = _context.ars_workordereventSet.Where(e => e.ars_WorkOrder.Id == workOrder.IncidentId);
            var incidentEvent =
                events.Where(e => e.ars_EventType.Value == previouscode.Key)
                    .OrderByDescending(e => e.ars_DateTime)
                    .FirstOrDefault();
            decimal? hours = 0;
            if (incidentEvent != null && eventType == EventType.CheckOut)
            {
                    var diff = DateTime.UtcNow.Subtract(incidentEvent.ars_DateTime.Value);
                    hours = diff.Hours + (decimal) diff.Minutes/60;
            }

            var workorderevent = new ars_workorderevent
            {
                ars_name = string.Format("{0} - Status Change", workOrder.Title),
                ars_DateTime = DateTime.UtcNow,
                ars_WorkOrder = workOrder.ToEntityReference(),
                ars_Technician = technician.ToEntityReference(),
                ars_WorkOrderStatus = status.Value,
                ars_EventType = new OptionSetValue
                {
                    Value = Convert.ToInt32(eventTypecode.Key)
                },
                ars_Hours = hours
            };

            _context.AddObject(workorderevent);
        }

/*        private void CreateWorkOrderEventOnNteIncrease(Incident workOrder, ars_technician technician, decimal money, decimal hours)
        {
            var eventTypecode = GetEventTypeValue(EventType.NteIncreaseRequest);

            var workorderevent = new ars_workorderevent
            {
                ars_name = string.Format("{0} - NTE Increase Request", workOrder.Title),
                ars_DateTime = DateTime.UtcNow,
                ars_WorkOrder = workOrder.ToEntityReference(),
                ars_Technician = technician.ToEntityReference(),
                ars_EventType = new OptionSetValue
                {
                    Value = Convert.ToInt32(eventTypecode.Key)
                },
                ars_Amount = new Money(money),
                ars_Hours = hours
            };
           

            _context.AddObject(workorderevent);
        }
*/
        private KeyValuePair<int, string> GetStatusOptionSetValue(StatusCode statusCode)
        {
            var options = _optionSetHelper.GetStringValues(Incident.EntityLogicalName, NameOf.Property(() => ((Incident)null).StatusCode));

            return options.Single(x => x.Value == statusCode.GetDescription());
        }

        private KeyValuePair<int, string> GetEventTypeValue(EventType statusCode)
        {
            var options = _optionSetHelper.GetStringValues(ars_workorderevent.EntityLogicalName, NameOf.Property(() => ((ars_workorderevent)null).ars_EventType));

            return options.Single(x => x.Value == statusCode.GetDescription());
        }

        private Dictionary<string, int> GetWorkItemStatuses()
        {
            return _optionSetHelper.GetStringValues(ars_workitem.EntityLogicalName, NameOf.Property(() => ((ars_workitem)null).statuscode)).ToDictionary(o => o.Value, o => o.Key);
        }

        private Dictionary<int, string> GetOrderStatuses()
        {
            var options = _optionSetHelper.GetStringValues(SalesOrder.EntityLogicalName, NameOf.Property(() => ((SalesOrder)null).StatusCode));
            return options;
        }
    }
}