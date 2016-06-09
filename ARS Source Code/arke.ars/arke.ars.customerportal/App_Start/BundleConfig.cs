using System.Web;
using System.Web.Optimization;

namespace Arke.ARS.CustomerPortal
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/scripts").Include(
                       "~/Scripts/jquery-2.1.4.js",
                       "~/Scripts/moment.js",
                       "~/Scripts/bootstrap.js",
                       "~/Scripts/bootstrap-notify.js",
                       "~/Scripts/bootstrap-datetimepicker.js",
                       "~/Scripts/animationService.js",
                       "~/Scripts/notificationService.js",
                       "~/Scripts/main.js"
                       )); 
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootgrid").Include("~/Scripts/jquery.bootgrid.min.js"));
            bundles.Add(new StyleBundle("~/styles/bootgrid").Include("~/Content/jquery.bootgrid.min.css"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css"));
        }
    }
}
