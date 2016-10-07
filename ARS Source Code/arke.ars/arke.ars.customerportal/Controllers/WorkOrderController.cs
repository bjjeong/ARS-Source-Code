using System;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.CustomerPortal.Models;
using Arke.ARS.CustomerPortal.Services;
using Microsoft.AspNet.Identity;
using PagedList;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.ServiceModel.Description;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Xrm.Client;
using Microsoft.Xrm.Client.Services;

namespace Arke.ARS.CustomerPortal.Controllers
{
    public sealed class WorkOrderController : Controller
    {
        private readonly IWorkOrderService _workOrderService;
        private readonly ILocationService _locationService;
        private readonly ILogger _logger;

        public WorkOrderController(IWorkOrderService workOrderService, ILocationService locationService, ILogger logger)
        {
            if (workOrderService == null)
            {
                throw new ArgumentNullException("workOrderService");
            }

            if (locationService == null)
            {
                throw new ArgumentNullException("locationService");
            }

            if (logger == null)
            {
                throw new ArgumentNullException("logger");
            }

            _workOrderService = workOrderService;
            _locationService = locationService;
            _logger = logger;
        }

        public ActionResult Index(QueryModel oq, QueryModel cq, bool? showOpen)
        {
            Guid customerId = GetCurrentCustomerId();

            IPagedList<ClosedWorkOrderModel> closedOrders = _workOrderService.GetClosedWorkOrdersModels(cq, customerId);
            IPagedList<OpenWorkOrderModel> openOrders = _workOrderService.GetOpenWorkOrdersModels(oq, customerId);

            var locationItems = _locationService.GetLocations(customerId).Select(l => new SelectListItem
            {
                Value = l.Id.ToString(),
                Text = l.Name
            }).ToList();
            locationItems.Insert(0, new SelectListItem());

/*          
            var connection = CrmConnection.Parse("Url=http://advancedretail.crm.dynamics.com; Username=bjeong@advancedretail.onmicrosoft.com; Password=bjtjjjaj1029.;");
            var service = new OrganizationService(connection);
            var context = new CrmOrganizationServiceContext(connection);
            IOrganizationService _service = service;

            QueryByAttribute query = new QueryByAttribute("account");
            query.ColumnSet = new ColumnSet("entityimage_url");
            query.AddAttributeValue("contact", "Brian Jeong");
            EntityCollection binaryImageResults = _service.RetrieveMultiple(query);
            String recordName = "blank.jpg";
            foreach (var record in binaryImageResults.Entities)
            {
                recordName = record.Attributes["entityimage_url"].ToString();
                Console.WriteLine(recordName);
            }
*/
            var model = new CustomerPortalModel(Url)
            {
                OpenOrders = openOrders,
                ClosedOrders = closedOrders,
                ShowOpen = showOpen ?? true,
                Locations = locationItems,
                ClosedWorkOrdersQuery = cq,
                OpenWorkOrdersQuery = oq,
                //imageUrl = recordName
            };

            TempData["ReturnToListUrl"] = Request.RawUrl;
            return View(model);
        }

        public ActionResult Details(Guid id)
        {
            WorkOrderDetailsModel model = _workOrderService.GetWorkOrderDetails(id);

            ViewData["ReturnToListUrl"] = TempData.ContainsKey("ReturnToListUrl")
                ? TempData["ReturnToListUrl"]
                : Url.Action("Index");
            return View(model);
        }

        public void Cancel(Guid orderId)
        {
            _workOrderService.CancelWorkOrder(orderId);
        }

        public void Reopen(Guid orderId)
        {
            _workOrderService.ReopenWorkOrder(orderId);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Add(NewWorkOrderModel model)
        {
            if (ModelState.IsValid)
            {
                _workOrderService.AddWorkOrder(model, GetCurrentCustomerId());
            }
            else
            {
                _logger.LogException("Invalid model state", ModelState.SelectMany(x => x.Value.Errors.Select(z => z.Exception)).First());
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public RedirectToRouteResult AddComment(Guid workOrderId, string comment, HttpPostedFileBase attachment)
        {
            _workOrderService.AddComment(workOrderId, GetCurrentCustomerId(), comment, attachment);
            return RedirectToAction("Details", new { id = workOrderId });
        }

        private Guid GetCurrentCustomerId()
        {
            var identity = (ClaimsIdentity)User.Identity;
            Guid customerId = Guid.Parse(identity.GetUserId());
            return customerId;
        }
    }
}
