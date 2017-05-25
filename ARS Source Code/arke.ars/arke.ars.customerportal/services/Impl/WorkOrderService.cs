using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using Arke.ARS.CommonWeb.Helpers;
using Arke.ARS.CustomerPortal.Models;
using Arke.ARS.Organization.Context;
using Arke.Crm.Utils.Helpers;
using Arke.Crm.Utils.Infrastructure.OptionSet;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using PagedList;

namespace Arke.ARS.CustomerPortal.Services.Impl
{
    public sealed class WorkOrderService : IWorkOrderService
    {
        private readonly IArsOrganizationContext _context;
        private readonly IOptionSetHelper _optionSetHelper;
        private readonly ICustomerService _customerService;
        private readonly Lazy<int> _pageSize = new Lazy<int>(() => Convert.ToInt32(ConfigurationManager.AppSettings["ItemsPerPage"]));
        private static readonly Dictionary<Type, Dictionary<string, Type>> SortColumnsMetadata = new Dictionary<Type, Dictionary<string, Type>>
        {
            { typeof(OpenWorkOrderModel), new Dictionary<string, Type>(typeof(OpenWorkOrderModel).GetProperties().ToDictionary(p => p.Name, p => p.PropertyType)) },
            { typeof(ClosedWorkOrderModel), new Dictionary<string, Type>(typeof(ClosedWorkOrderModel).GetProperties().ToDictionary(p => p.Name, p => p.PropertyType)) },
        };

        public WorkOrderService(IArsOrganizationContext context, IOptionSetHelper optionSetHelper, ICustomerService customerService)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (optionSetHelper == null)
            {
                throw new ArgumentNullException("optionSetHelper");
            }

            if (customerService == null)
            {
                throw new ArgumentNullException("customerService");
            }

            _context = context;
            _optionSetHelper = optionSetHelper;
            _customerService = customerService;
        }

        public WorkOrderDetailsModel GetWorkOrderDetails(Guid workOrderId)
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

            Dictionary<int, string> workOrderStatuses = GetWorkOrderStatusCodes();

            return new WorkOrderDetailsModel
            {
                CreatedOn = workOrder.CreatedOn.Value,
                Location = workOrder.ars_Location == null ? "<undefined>" : workOrder.ars_Location.Name,
                LocationAddress = GetLocationAddress(workOrder.ars_Location),
                Id = workOrderId,
                Name = workOrder.Title,
                TicketNumber = workOrder.TicketNumber,
                ScheduledOn = workOrder.ars_CompleteByDate,
                Activities = activiteList.OrderByDescending(a => a.CreatedOn).ToArray(),
                Orders = orders,
                PurchaseOrderNumber = workOrder.new_PO,
                Nte = workOrder.new_NotToExceedNTE == null ? 0 : workOrder.new_NotToExceedNTE.Value,
                DescriptionOfService = workOrder.Description, 
                Status = workOrderStatuses[workOrder.StatusCode.Value]
            };
        }
        
        private AddressModel GetLocationAddress(EntityReference locationRef)
        {
            if (locationRef == null)
            {
                return null;
            }

            Account location = _context.AccountSet.First(a => a.Id == locationRef.Id);
            return new AddressModel
            {
                Address1 = location.Address1_Line1,
                Address2 = location.Address1_Line2,
                City = location.Address1_City,
                State = location.Address1_StateOrProvince,
                PostalCode = location.Address1_PostalCode
            };
        }

        public LocationInfoModel GetSpecificLocationInfo(Guid id)
        {
            if(id == null)
            {
                return null;
            }

            Account location = _context.AccountSet.First(a => a.Id == id);
            return new LocationInfoModel
            {
                WaterHeaterType = location.new_WaterHeaterType,
                FloorTile = location.new_FloorTile,
                HVACSpec = location.new_HVACSpec,
                CeilingTile = location.new_CeilingTile,
                PanelType = location.new_PanelType,
                SepticSewer = location.new_SepticSewer, 
                PaintSpec = location.new_PaintSpec
            };
        }

        public LocationAddressModel GetLocationInfo(Guid id)
        {
            if (id == null)
            {
                return null;
            }

            Account location = _context.AccountSet.First(a => a.Id == id);
            return new LocationAddressModel
            {
                Name = location.Name,
                Address1 = location.Address1_Line1,
                Address2 = location.Address1_Line2,
                City = location.Address1_City,
                State = location.Address1_StateOrProvince,
                PostalCode = location.Address1_PostalCode
            };
        }

        public IPagedList<ClosedWorkOrderModel> GetClosedWorkOrdersModels(QueryModel query, Guid customerId)
        {
            if (query == null)
            {
                throw new ArgumentNullException("query");
            }

            var workItemStatuses = GetWorkOrderStatusCodes();

            var directlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                join contact in _context.ContactSet on location.AccountId equals contact.ParentCustomerId.Id
                where contact.ContactId == customerId
                where workOrder.StateCode.Value != IncidentState.Active
                select new ClosedWorkOrderColumnProjection
                {
                    Id = workOrder.IncidentId.Value,
                    Title = workOrder.Title,
                    Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                    OrderNumber = workOrder.TicketNumber,
                    Amount = workOrder.new_NotToExceedNTE != null ? workOrder.new_NotToExceedNTE.Value : 0,
                    Status = workItemStatuses[workOrder.StatusCode.Value]
                }).ToArray();

            var indirectlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                join business in _context.AccountSet on location.ParentAccountId.Id equals business.AccountId
                join contact in _context.ContactSet on business.AccountId equals contact.ParentCustomerId.Id
                where contact.ContactId == customerId
                where workOrder.StateCode.Value != IncidentState.Active
                select new ClosedWorkOrderColumnProjection
                {
                    Id = workOrder.IncidentId.Value,
                    Title = workOrder.Title,
                    Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                    OrderNumber = workOrder.TicketNumber,
                    Amount = workOrder.new_NotToExceedNTE != null ? workOrder.new_NotToExceedNTE.Value : 0,
                    Status = workItemStatuses[workOrder.StatusCode.Value]
                }).ToArray();

            IEnumerable<ClosedWorkOrderColumnProjection> closedOrders = directlyRelatedWorkOrders.Union(indirectlyRelatedWorkOrders, ClosedWorkOrderColumnProjection.Comparer);

            var closedOrdersModels = new List<ClosedWorkOrderModel>();
            foreach (var order in closedOrders)
            {
                EntityReference techRef =
                    (from appointment in _context.ServiceAppointmentSet
                        where appointment.RegardingObjectId.Id == order.Id
                        orderby appointment.ScheduledEnd descending
                        select appointment.ars_Technician).FirstOrDefault();

                closedOrdersModels.Add(new ClosedWorkOrderModel
                {
                    Id = order.Id,
                    Title = order.Title,
                    Location = order.Location,
                    OrderNumber = order.OrderNumber,
                    Amount = order.Amount,
                    Tech = techRef != null ? techRef.Name : String.Empty,
                    Status = order.Status
                });
            }

            return SortByColumn(closedOrdersModels, query.SortColumn, query.SortOrder).ToPagedList(query.PageIndex, _pageSize.Value);
        }

        public IPagedList<OpenWorkOrderModel> GetOpenWorkOrdersModels(QueryModel query, Guid customerId)
        {
            if (query == null)
            {
                throw new ArgumentNullException("query");
            }

            var workItemStatuses = GetWorkOrderStatusCodes();

            var directlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                join contact in _context.ContactSet on location.AccountId equals contact.ParentCustomerId.Id
                join store in _context.AccountSet on workOrder.ars_Location.Id equals store.AccountId
                where contact.ContactId == customerId
                where workOrder.StateCode.Value == IncidentState.Active
                select new OpenWorkOrderModel
                {
                    Id = workOrder.IncidentId.Value,
                    Title = workOrder.Title,
                    Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                    LocationId = workOrder.ars_Location.Id,
                    OrderNumber = workOrder.TicketNumber,
                    NeedBy = workOrder.ars_CompleteByDate,
                    City = store.Address1_City,
                    State = store.Address1_StateOrProvince,
                    Priority = workOrder.PriorityCode.Value,
                    Trade = workOrder.new_trade,
                    Status = workItemStatuses[workOrder.StatusCode.Value]
                }).ToArray();

            var indirectlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                join business in _context.AccountSet on location.ParentAccountId.Id equals business.AccountId
                join contact in _context.ContactSet on business.AccountId equals contact.ParentCustomerId.Id
                where contact.ContactId == customerId
                where workOrder.StateCode.Value == IncidentState.Active
                select new OpenWorkOrderModel
                {
                    Id = workOrder.IncidentId.Value,
                    Title = workOrder.Title,
                    Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                    LocationId = workOrder.ars_Location.Id,
                    OrderNumber = workOrder.TicketNumber,
                    NeedBy = workOrder.ars_CompleteByDate,
                    City = location.Address1_City,
                    State = location.Address1_StateOrProvince,
                    Priority = workOrder.PriorityCode.Value,
                    Trade = workOrder.new_trade,
                    Status = workItemStatuses[workOrder.StatusCode.Value]
                }).ToArray();

            IEnumerable<OpenWorkOrderModel> openOrders = directlyRelatedWorkOrders.Union(indirectlyRelatedWorkOrders, OpenWorkOrderModel.Comparer);

            return SortByColumn(openOrders, query.SortColumn, query.SortOrder).ToPagedList(query.PageIndex, _pageSize.Value);
        }

        public IPagedList<ScheduledWorkOrderModel> GetScheduledWorkOrdersModels(QueryModel query, Guid customerId)
        {
            if (query == null)
            {
                throw new ArgumentNullException("query");
            }

            var workItemStatuses = GetWorkOrderStatusCodes();

            var directlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                             join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                             join contact in _context.ContactSet on location.AccountId equals contact.ParentCustomerId.Id
                                             join store in _context.AccountSet on workOrder.ars_Location.Id equals store.AccountId
                                             where contact.ContactId == customerId
                                             where workOrder.StateCode.Value == IncidentState.Active
                                             where workOrder.StatusCode.Value == 172860002
                                             select new ScheduledWorkOrderModel
                                             {
                                                 Id = workOrder.IncidentId.Value,
                                                 Title = workOrder.Title,
                                                 Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                 LocationId = workOrder.ars_Location.Id,
                                                 OrderNumber = workOrder.TicketNumber,
                                                 NeedBy = workOrder.ars_CompleteByDate,
                                                 City = store.Address1_City,
                                                 State = store.Address1_StateOrProvince,
                                                 Priority = workOrder.PriorityCode.Value,
                                                 Trade = workOrder.new_trade,
                                                 Status = workItemStatuses[workOrder.StatusCode.Value]
                                             }).ToArray();

            var indirectlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                               join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                               join business in _context.AccountSet on location.ParentAccountId.Id equals business.AccountId
                                               join contact in _context.ContactSet on business.AccountId equals contact.ParentCustomerId.Id
                                               where contact.ContactId == customerId
                                               where workOrder.StateCode.Value == IncidentState.Active
                                               where workOrder.StatusCode.Value == 172860002
                                               select new ScheduledWorkOrderModel
                                               {
                                                   Id = workOrder.IncidentId.Value,
                                                   Title = workOrder.Title,
                                                   Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                   LocationId = workOrder.ars_Location.Id,
                                                   OrderNumber = workOrder.TicketNumber,
                                                   NeedBy = workOrder.ars_CompleteByDate,
                                                   City = location.Address1_City,
                                                   State = location.Address1_StateOrProvince,
                                                   Priority = workOrder.PriorityCode.Value,
                                                   Trade = workOrder.new_trade,
                                                   Status = workItemStatuses[workOrder.StatusCode.Value]
                                               }).ToArray();

            IEnumerable<ScheduledWorkOrderModel> scheduledOrders = directlyRelatedWorkOrders.Union(indirectlyRelatedWorkOrders, ScheduledWorkOrderModel.Comparer);

            return scheduledOrders.ToPagedList(query.PageIndex, _pageSize.Value);
        }

        public IPagedList<QuoteApprovalWorkOrderModel> GetQuoteApprovalWorkOrdersModels(QueryModel query, Guid customerId)
        {
            if (query == null)
            {
                throw new ArgumentNullException("query");
            }

            var workItemStatuses = GetWorkOrderStatusCodes();

            var directlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                             join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                             join contact in _context.ContactSet on location.AccountId equals contact.ParentCustomerId.Id
                                             join store in _context.AccountSet on workOrder.ars_Location.Id equals store.AccountId
                                             where contact.ContactId == customerId
                                             where workOrder.StateCode.Value == IncidentState.Active
                                             where workOrder.StatusCode.Value == 172860016
                                             select new QuoteApprovalWorkOrderModel
                                             {
                                                 Id = workOrder.IncidentId.Value,
                                                 Title = workOrder.Title,
                                                 Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                 LocationId = workOrder.ars_Location.Id,
                                                 OrderNumber = workOrder.TicketNumber,
                                                 NeedBy = workOrder.ars_CompleteByDate,
                                                 City = store.Address1_City,
                                                 State = store.Address1_StateOrProvince,
                                                 Priority = workOrder.PriorityCode.Value,
                                                 Trade = workOrder.new_trade,
                                                 Status = workItemStatuses[workOrder.StatusCode.Value]
                                             }).ToArray();

            var indirectlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                               join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                               join business in _context.AccountSet on location.ParentAccountId.Id equals business.AccountId
                                               join contact in _context.ContactSet on business.AccountId equals contact.ParentCustomerId.Id
                                               where contact.ContactId == customerId
                                               where workOrder.StateCode.Value == IncidentState.Active
                                               where workOrder.StatusCode.Value == 172860016
                                               select new QuoteApprovalWorkOrderModel
                                               {
                                                   Id = workOrder.IncidentId.Value,
                                                   Title = workOrder.Title,
                                                   Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                   LocationId = workOrder.ars_Location.Id,
                                                   OrderNumber = workOrder.TicketNumber,
                                                   NeedBy = workOrder.ars_CompleteByDate,
                                                   City = location.Address1_City,
                                                   State = location.Address1_StateOrProvince,
                                                   Priority = workOrder.PriorityCode.Value,
                                                   Trade = workOrder.new_trade,
                                                   Status = workItemStatuses[workOrder.StatusCode.Value]
                                               }).ToArray();

            IEnumerable<QuoteApprovalWorkOrderModel> quoteApprovalOrders = directlyRelatedWorkOrders.Union(indirectlyRelatedWorkOrders, QuoteApprovalWorkOrderModel.Comparer);

            return quoteApprovalOrders.ToPagedList(query.PageIndex, _pageSize.Value);
        }

        public IPagedList<ClosedWorkOrderModel> GetLocationClosedWorkOrdersModels(QueryModel query, Guid customerId)
        {
            if (query == null)
            {
                throw new ArgumentNullException("query");
            }

            var workItemStatuses = GetWorkOrderStatusCodes();

            var directlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                             join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                             join contact in _context.ContactSet on location.AccountId equals contact.ParentCustomerId.Id
                                             where contact.ContactId == customerId
                                             where workOrder.StateCode.Value != IncidentState.Active
                                             select new ClosedWorkOrderColumnProjection
                                             {
                                                 Id = workOrder.IncidentId.Value,
                                                 Title = workOrder.Title,
                                                 Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                 OrderNumber = workOrder.TicketNumber,
                                                 Amount = workOrder.new_NotToExceedNTE != null ? workOrder.new_NotToExceedNTE.Value : 0,
                                                 Status = workItemStatuses[workOrder.StatusCode.Value]
                                             }).ToArray();

            var indirectlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                               join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                               join business in _context.AccountSet on location.ParentAccountId.Id equals business.AccountId
                                               join contact in _context.ContactSet on business.AccountId equals contact.ParentCustomerId.Id
                                               where contact.ContactId == customerId
                                               where workOrder.StateCode.Value != IncidentState.Active
                                               select new ClosedWorkOrderColumnProjection
                                               {
                                                   Id = workOrder.IncidentId.Value,
                                                   Title = workOrder.Title,
                                                   Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                   OrderNumber = workOrder.TicketNumber,
                                                   Amount = workOrder.new_NotToExceedNTE != null ? workOrder.new_NotToExceedNTE.Value : 0,
                                                   Status = workItemStatuses[workOrder.StatusCode.Value]
                                               }).ToArray();

            IEnumerable<ClosedWorkOrderColumnProjection> closedOrders = directlyRelatedWorkOrders.Union(indirectlyRelatedWorkOrders, ClosedWorkOrderColumnProjection.Comparer);

            var closedOrdersModels = new List<ClosedWorkOrderModel>();
            foreach (var order in closedOrders)
            {
                EntityReference techRef =
                    (from appointment in _context.ServiceAppointmentSet
                     where appointment.RegardingObjectId.Id == order.Id
                     orderby appointment.ScheduledEnd descending
                     select appointment.ars_Technician).FirstOrDefault();

                closedOrdersModels.Add(new ClosedWorkOrderModel
                {
                    Id = order.Id,
                    Title = order.Title,
                    Location = order.Location,
                    OrderNumber = order.OrderNumber,
                    Amount = order.Amount,
                    Tech = techRef != null ? techRef.Name : String.Empty,
                    Status = order.Status
                });
            }

            return SortByColumn(closedOrdersModels, query.SortColumn, query.SortOrder).ToPagedList(query.PageIndex, _pageSize.Value);
        }

        public IPagedList<OpenWorkOrderModel> GetLocationOpenWorkOrdersModels(QueryModel query, Guid customerId)
        {
            if (query == null)
            {
                throw new ArgumentNullException("query");
            }

            var workItemStatuses = GetWorkOrderStatusCodes();

            var directlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                             join location in _context.AccountSet on workOrder.ars_Location.Id equals location.AccountId
                                             where location.AccountId == customerId
                                             where workOrder.StateCode.Value == IncidentState.Active
                                             select new OpenWorkOrderModel
                                             {
                                                 Id = workOrder.IncidentId.Value,
                                                 Title = workOrder.Title,
                                                 Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                 LocationId = workOrder.ars_Location.Id,
                                                 OrderNumber = workOrder.TicketNumber,
                                                 NeedBy = workOrder.ars_CompleteByDate,
                                                 City = location.Address1_City,
                                                 State = location.Address1_StateOrProvince,
                                                 Priority = workOrder.PriorityCode.Value,
                                                 Trade = workOrder.new_trade,
                                                 Status = workItemStatuses[workOrder.StatusCode.Value]
                                             }).ToArray();

            var indirectlyRelatedWorkOrders = (from workOrder in _context.IncidentSet
                                               join location in _context.AccountSet on workOrder.CustomerId.Id equals location.AccountId
                                               join business in _context.AccountSet on location.ParentAccountId.Id equals business.AccountId
                                               join contact in _context.ContactSet on business.AccountId equals contact.ParentCustomerId.Id
                                               where contact.ContactId == customerId
                                               where workOrder.StateCode.Value == IncidentState.Active
                                               select new OpenWorkOrderModel
                                               {
                                                   Id = workOrder.IncidentId.Value,
                                                   Title = workOrder.Title,
                                                   Location = workOrder.ars_Location == null ? String.Empty : workOrder.ars_Location.Name,
                                                   LocationId = workOrder.ars_Location.Id,
                                                   OrderNumber = workOrder.TicketNumber,
                                                   NeedBy = workOrder.ars_CompleteByDate,
                                                   City = location.Address1_City,
                                                   State = location.Address1_StateOrProvince,
                                                   Priority = workOrder.PriorityCode.Value,
                                                   Trade = workOrder.new_trade,
                                                   Status = workItemStatuses[workOrder.StatusCode.Value]
                                               }).ToArray();

            IEnumerable<OpenWorkOrderModel> openOrders = directlyRelatedWorkOrders.Union(indirectlyRelatedWorkOrders, OpenWorkOrderModel.Comparer);

            return SortByColumn(openOrders, query.SortColumn, query.SortOrder).ToPagedList(query.PageIndex, _pageSize.Value);
        }

        private static Func<TSource, TKey> CreateSortExpression<TSource, TKey>(string sortColumn)
        {
            ParameterExpression parameter = Expression.Parameter(typeof(TSource));
            MemberExpression property = Expression.Property(parameter, sortColumn);
            Expression<Func<TSource, TKey>> sortExpresison = Expression.Lambda<Func<TSource, TKey>>(property, parameter);
            return sortExpresison.Compile();
        }

        private static IEnumerable<T> SortByColumn<T>(IEnumerable<T> source, string columnName, bool? sortOrder)
        {
            if (sortOrder == null)
            {
                return source;
            }

            Type sortColumnType;
            if (SortColumnsMetadata[typeof(T)].TryGetValue(columnName, out sortColumnType))
            {
                if (sortColumnType == typeof (string))
                {
                    Func<T, string> sortExpresison = CreateSortExpression<T, string>(columnName);
                    return sortOrder.Value ? source.OrderBy(sortExpresison) : source.OrderByDescending(sortExpresison);
                }
                
                if (sortColumnType == typeof(DateTime?))
                {
                    Func<T, DateTime?> sortExpresison = CreateSortExpression<T, DateTime?>(columnName);
                    return sortOrder.Value ? source.OrderBy(sortExpresison) : source.OrderByDescending(sortExpresison);
                }

                if (sortColumnType == typeof(decimal))
                {
                    Func<T, decimal> sortExpresison = CreateSortExpression<T, decimal>(columnName);
                    return sortOrder.Value ? source.OrderBy(sortExpresison) : source.OrderByDescending(sortExpresison);
                }

                throw new NotSupportedException(String.Format("Column type '{0}' is not supported for sorting", sortColumnType));
            }

            return source;
        }

        private Dictionary<string, int> GetWorkOrderStatuses()
        {
            var options = _optionSetHelper.GetStringValues(Incident.EntityLogicalName, NameOf.Property(() => ((Incident)null).StatusCode)).ToDictionary(o => o.Value, o => o.Key);
            return options;
        }

        private Dictionary<int, string> GetOrderStatuses()
        {
            var options = _optionSetHelper.GetStringValues(SalesOrder.EntityLogicalName, NameOf.Property(() => ((SalesOrder)null).StatusCode));
            return options;
        }

        private Dictionary<int, string> GetWorkOrderStatusCodes()
        {
            var options = _optionSetHelper.GetStringValues(Incident.EntityLogicalName, NameOf.Property(() => ((Incident)null).StatusCode)).ToDictionary(o => o.Key, o => o.Value);
            return options;
        }

        //public void AddLocationNotes(Guid locationId, string comment)
        //{

        //    if (String.IsNullOrWhiteSpace(comment))
        //    {
        //        return;
        //    }

        //    var annotation = new Annotation
        //    {
        //        NoteText = String.Format("{0}", comment),
        //        ObjectId = new EntityReference(Incident.EntityLogicalName, locationId)
        //    };

        //    _context.AddObject(annotation);
        //    _context.SaveChanges();
        //}

        public void AddWorkOrder(NewWorkOrderModel model, Guid contactId)
        {
            var customerReference = _context.AccountSet.Single(a => a.PrimaryContactId.Id == contactId).ToEntityReference();
            var locationReference = _context.AccountSet.Single(l => l.AccountId == model.Locations).ToEntityReference();

            OptionSetValue myOptionSet = new OptionSetValue();
            if (model.Trade == "General Maintenance")
                myOptionSet.Value = 100000003;
            else if (model.Trade == "Electrical")
                myOptionSet.Value = 100000001;
            else if (model.Trade == "HVAC")
                myOptionSet.Value = 100000002;
            else if (model.Trade == "Plumbing")
                myOptionSet.Value = 100000000;
            else if (model.Trade == "Refrigeration")
                myOptionSet.Value = 100000004;
            else
                myOptionSet.Value = 100000003;

            var order = new Incident
            {
                ars_Location = locationReference,
                new_NotToExceedNTE = new Money(model.Nte),
                Title = model.Title,
                Description = model.Description,
                ars_CompleteByDate = model.NeedByDate == DateTime.MinValue ? (DateTime?)null : model.NeedByDate,
                CustomerId = customerReference,
                new_PO = model.PO,
                new_TradeType = myOptionSet
            };

            _context.AddObject(order);
            _context.SaveChanges();
            if (model.Attachment != null)
            {
                AddComment(order.Id, contactId, null, model.Attachment);
            }
        }

        public void CancelWorkOrder(Guid orderId)
        {
            Dictionary<string, int> workItemStatuses = GetWorkOrderStatuses();

            Incident workOrder = _context.IncidentSet.First(i => i.Id == orderId);
            if (workItemStatuses["Pending"] != workOrder.StatusCode.Value)
            {
                throw new InvalidOperationException(String.Format("Work order '{0}' cannot be canceled because it is not in 'Pending' status", workOrder.TicketNumber));
            }

            var req = new SetStateRequest
            {
                EntityMoniker = new EntityReference(Incident.EntityLogicalName, orderId),
                State = new OptionSetValue((int)IncidentState.Canceled),
                Status = new OptionSetValue(workItemStatuses["Canceled"])
            };

            _context.Execute(req);
        }

        public void ReopenWorkOrder(Guid orderId)
        {
            Dictionary<string, int> workItemStatuses = GetWorkOrderStatuses();
            var req = new SetStateRequest
            {
                EntityMoniker = new EntityReference(Incident.EntityLogicalName, orderId),
                State = new OptionSetValue((int)IncidentState.Active),
                Status = new OptionSetValue(workItemStatuses["Recall"])
            };

            _context.Execute(req);
        }

        public void AddComment(Guid workOrderId, Guid customerId, string comment, HttpPostedFileBase attachment)
        {
            bool hasAttachment = attachment != null && attachment.ContentLength > 0;

            if (String.IsNullOrWhiteSpace(comment) && !hasAttachment)
            {
                return;
            }

            string customerName = _customerService.GetCustomerName(customerId);

            var workOrderNote = new ars_workordernote
            {
                ars_NoteText = String.IsNullOrWhiteSpace(comment) ? customerName : String.Format("{0} - {1}", customerName, comment),
                ars_WorkOrderId = new EntityReference(Incident.EntityLogicalName, workOrderId),
                ars_Attachments = hasAttachment
            };

            _context.AddObject(workOrderNote);
            _context.SaveChanges();

            if (hasAttachment)
            {
                var annotation = new Annotation
                {
                    FileName = attachment.GetNonEmptyFileName(),
                    ObjectId = new EntityReference(ars_workordernote.EntityLogicalName, workOrderNote.Id),
                    DocumentBody = attachment.ConvertToBase64()
                };

                _context.AddObject(annotation);
                _context.SaveChanges();
            }
        }
        
        private sealed class ClosedWorkOrderColumnProjection
        {
            public Guid Id { get; set; }
            public string Title { get; set; }
            public string Location { get; set; }
            public string OrderNumber { get; set; }
            public decimal Amount { get; set; }

            public string Status { get; set; }

            public override bool Equals(object obj)
            {
                return Equals(obj as ClosedWorkOrderColumnProjection);
            }

            private bool Equals(ClosedWorkOrderColumnProjection other)
            {
                if (other == null)
                {
                    return false;
                }

                return Id.Equals(other.Id) && string.Equals(Title, other.Title) && string.Equals(Location, other.Location) && string.Equals(OrderNumber, other.OrderNumber) && Amount == other.Amount && string.Equals(Status, other.Status);
            }

            public override int GetHashCode()
            {
                unchecked
                {
                    int hashCode = Id.GetHashCode();
                    hashCode = (hashCode * 397) ^ (Title != null ? Title.GetHashCode() : 0);
                    hashCode = (hashCode * 397) ^ (Location != null ? Location.GetHashCode() : 0);
                    hashCode = (hashCode * 397) ^ (OrderNumber != null ? OrderNumber.GetHashCode() : 0);
                    hashCode = (hashCode * 397) ^ Amount.GetHashCode();
                    hashCode = (hashCode * 397) ^ (Status != null ? Status.GetHashCode() : 0);
                    return hashCode;
                }
            }

            public static readonly IEqualityComparer<ClosedWorkOrderColumnProjection> Comparer = new ClosedWorkOrderColumnProjectionEqualityComparer();

            private sealed class ClosedWorkOrderColumnProjectionEqualityComparer : IEqualityComparer<ClosedWorkOrderColumnProjection>
            {
                public bool Equals(ClosedWorkOrderColumnProjection x, ClosedWorkOrderColumnProjection y)
                {
                    return x.Equals(y);
                }

                public int GetHashCode(ClosedWorkOrderColumnProjection obj)
                {
                    return obj.GetHashCode(); 
                }
            }
        }
    }
}