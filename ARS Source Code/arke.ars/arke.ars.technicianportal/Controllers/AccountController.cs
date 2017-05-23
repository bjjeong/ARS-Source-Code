using System.Web;
using System.Web.Mvc;
using Microsoft.Owin.Security;
using System.IO;
using System.Net;
using System.Net.Mail;
using Arke.ARS.TechnicianPortal.Models;
using Arke.ARS.TechnicianPortal.Services;
using Arke.ARS.CommonWeb.Services;

namespace Arke.ARS.TechnicianPortal.Controllers
{
    public sealed class AccountController : Controller
    {
        //private readonly IWorkOrderService _workOrderService;

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

            ViewBag.Title = "Sign In";
            ViewBag.BodyCss = "sign-in";

            return View();
        }

        // GET: Home
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Submit(ApplicationModel model)
        {

            using (MailMessage mm = new MailMessage("bjeong@advancedretailsolutions.com", "brianjeong55@gmail.com"))
            {
                mm.Subject = "Contractor Application";
                mm.Body = model.Body;
                mm.IsBodyHtml = false;
                using (SmtpClient smtp = new SmtpClient())
                {
                    smtp.Host = "smtp.office365.com";
                    smtp.EnableSsl = true;
                    NetworkCredential NetworkCred = new NetworkCredential("bjeong@advancedretailsolutions.com", "Password12");
                    smtp.UseDefaultCredentials = true;
                    smtp.Credentials = NetworkCred;
                    smtp.Port = 587;
                    smtp.Send(mm);
                    ViewBag.Message = "Email sent.";
                }
            }

            return View();
        }
    }
}
