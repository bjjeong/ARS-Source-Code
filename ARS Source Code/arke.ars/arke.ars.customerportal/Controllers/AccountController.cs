using System.Web;
using System.Web.Mvc;
using Microsoft.Owin.Security;

namespace Arke.ARS.CustomerPortal.Controllers
{
    public sealed class AccountController : Controller
    {
        public ActionResult SignOut()
        {
            IAuthenticationManager authManager = Request.GetOwinContext().Authentication;
            authManager.SignOut();

            return RedirectToAction("SignIn");
        }

        [AllowAnonymous]
        public ActionResult SignIn()
        {
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "WorkOrder");
            }

            ViewBag.Title = "Sign In";
            ViewBag.BodyCss = "sign-in"; 

            return View();
        }
    }
}
