using System.Web.Optimization;

namespace Arke.ARS.TechnicianPortal
{
    public static class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/scripts").Include(
                        "~/Scripts/jquery-2.1.4.js",
                        "~/Scripts/bootstrap.js",
                        "~/Scripts/bootstrap-notify.js",
                        "~/Scripts/fastclick.js",
                        "~/Scripts/animationService.js",
                        "~/Scripts/notificationService.js"
                        ));

            bundles.Add(new ScriptBundle("~/bundles/fullcalendar").Include(
                        "~/Scripts/moment.js",
                        "~/Scripts/fullcalendar.js"
                        ));

            bundles.Add(new ScriptBundle("~/bundles/signature").Include(
                "~/Scripts/jquery-ui.1.10.3.min.js",
                "~/Scripts/jquery.ui.touch-punch.min.js",
                "~/Scripts/jquery.signature.js"));

            bundles.Add(new ScriptBundle("~/bundles/purchaseOrder").Include("~/Scripts/jquery.bootgrid.min.js"));
            bundles.Add(new StyleBundle("~/styles/purchaseOrder").Include("~/Content/jquery.bootgrid.min.css"));
            bundles.Add(new StyleBundle("~/styles/purchaseOrder").Include("~/Content/technician-portal.css"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));
        }
    }
}
