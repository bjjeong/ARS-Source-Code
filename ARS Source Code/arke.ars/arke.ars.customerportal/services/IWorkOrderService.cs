using System;
using System.Web;
using Arke.ARS.CustomerPortal.Models;
using PagedList;

namespace Arke.ARS.CustomerPortal.Services
{
    public interface IWorkOrderService
    {
        IPagedList<ClosedWorkOrderModel> GetClosedWorkOrdersModels(QueryModel query, Guid customerId);

        IPagedList<OpenWorkOrderModel> GetOpenWorkOrdersModels(QueryModel query, Guid customerId);

        IPagedList<ClosedWorkOrderModel> GetLocationClosedWorkOrdersModels(QueryModel query, Guid customerId);

        IPagedList<OpenWorkOrderModel> GetLocationOpenWorkOrdersModels(QueryModel query, Guid customerId);

        WorkOrderDetailsModel GetWorkOrderDetails(Guid workOrderId);

        LocationAddressModel GetLocationInfo(Guid id);

        //LocationDetailsModel GetLocationDetails(Guid locationId);

        void AddLocationNotes(Guid id, string comment);

        void AddWorkOrder(NewWorkOrderModel model, Guid contactId);

        void CancelWorkOrder(Guid orderId);

        void ReopenWorkOrder(Guid orderId);

        void AddComment(Guid workOrderId, Guid customerId, string comment, HttpPostedFileBase attachment);
    }
}