using System;
using System.Text;
using System.Collections.Generic;
using System.Web.Mvc;
using System.Web.Routing;
using PagedList;

namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class LocationDetailsModel
    {
        private readonly UrlHelper _urlHelper;

        public LocationDetailsModel(UrlHelper urlHelper)
        {
            if (urlHelper == null)
            {
                throw new ArgumentNullException("urlHelper");
            }

            _urlHelper = urlHelper;
        }

        public IPagedList<ClosedWorkOrderModel> LocationClosedOrders { get; set; }
        public IPagedList<OpenWorkOrderModel> LocationOpenOrders { get; set; }
        public List<SelectListItem> Locations { get; set; }
        public QueryModel OpenWorkOrdersQuery { get; set; }
        public QueryModel ClosedWorkOrdersQuery { get; set; }
        public LocationAddressModel LocationAddress { get; set; }
        public Guid Id { get; set; }
        public bool ShowOpen { get; set; }
        public string imageUrl { get; set; }
        public string Name { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string City { get; set; }
        public string State { get; set; } 
        public string PostalCode { get; set; }
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

    public sealed class LocationAddressModel
    {
        public string Name { get; set; }

        public string Address1 { get; set; }

        public string Address2 { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string PostalCode { get; set; }

        public string GetCityLine()
        {
            var sb = new StringBuilder();

            bool hasCity = false;
            if (!String.IsNullOrWhiteSpace(City))
            {
                hasCity = true;
                sb.Append(City);
            }

            bool hasState = false;
            if (!String.IsNullOrWhiteSpace(State))
            {
                hasState = true;

                if (hasCity)
                {
                    sb.Append(", ");
                }

                sb.Append(State);
            }

            if (!String.IsNullOrWhiteSpace(PostalCode))
            {
                if (hasCity || hasState)
                {
                    sb.Append(' ');
                }

                sb.Append(PostalCode);
            }

            return sb.ToString();
        }
    }
}