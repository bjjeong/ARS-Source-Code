using System.Web;
using System.Web.Mvc;
using Microsoft.Owin.Security;

namespace Arke.ARS.TechnicianPortal.Controllers
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
                return RedirectToAction("Home", "Home");
            }

            ViewBag.Title = "Please Sign in to ARS.";
            ViewBag.BodyCss = "sign-in";

            return View();
        }
    }
}
