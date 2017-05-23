using System;
using System.Collections.Generic;
using System.Web.Mvc;
using System.Web.Routing;
using PagedList;

namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class CustomerPortalModel
    {
        private readonly UrlHelper _urlHelper;

        public CustomerPortalModel(UrlHelper urlHelper)
        {
            if (urlHelper == null)
            {
                throw new ArgumentNullException("urlHelper");
            } 

            _urlHelper = urlHelper;
        }

        public IPagedList<ClosedWorkOrderModel> ClosedOrders { get; set; }
        public IPagedList<OpenWorkOrderModel> OpenOrders { get; set; }
        public IPagedList<ScheduledWorkOrderModel> ScheduledOrders { get; set; }
        public IPagedList<QuoteApprovalWorkOrderModel> QuoteApprovalOrders { get; set; }
        public List<SelectListItem> Locations { get; set; }
        public QueryModel OpenWorkOrdersQuery{ get; set; }
        public QueryModel ClosedWorkOrdersQuery { get; set; }
        public QueryModel ScheduledWOrkOrdersQuery { get; set; }
        public QueryModel QuoteApprovalWorkOrdersQuery { get; set; }
        public bool ShowOpen { get; set; }
        public string imageUrl { get; set; }

        public string GetQueryLink(string columnName, bool forOpen)
        {
            string prefix = GetPrefix(forOpen);
            QueryModel query = forOpen ? OpenWorkOrdersQuery : ClosedWorkOrdersQuery;

            return _urlHelper.Action("Index", new RouteValueDictionary(new Dictionary<string, object>
            {
                { prefix + ".PageIndex", query.PageIndex },
                { prefix + ".SortColumn", columnName },
                { prefix + ".SortOrder", query.SortColumn == columnName ? !query.SortOrder : true },
                { "showOpen", forOpen }
            }));
        }

        public string GetQueryLink(int pageIndex, bool forOpen)
        {
            string prefix = GetPrefix(forOpen);
            QueryModel query = forOpen ? OpenWorkOrdersQuery : ClosedWorkOrdersQuery;

            return _urlHelper.Action("Index", new RouteValueDictionary(new Dictionary<string, object>
            {
                { prefix + ".PageIndex", pageIndex },
                { prefix + ".SortColumn", query.SortColumn },
                { prefix + ".SortOrder", query.SortOrder },
                { "showOpen", forOpen }
            }));
        }

        private static string GetPrefix(bool forOpen)
        {
            return forOpen ? "oq" : "cq";
        }
    }
}