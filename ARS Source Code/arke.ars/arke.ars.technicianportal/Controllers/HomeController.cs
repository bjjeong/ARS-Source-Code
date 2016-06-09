using System.Web.Mvc;

namespace Arke.ARS.TechnicianPortal.Controllers
{
    public sealed class HomeController : Controller
    {
        public ActionResult Home()
        {
            ViewBag.Title = "Your Daily Calendar.";
            ViewBag.BodyCss = "home";

            return View();
        }
    }
}
