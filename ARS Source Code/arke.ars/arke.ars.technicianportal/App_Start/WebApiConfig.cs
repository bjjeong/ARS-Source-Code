using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Arke.ARS.TechnicianPortal
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
                );

            config.Filters.Add(new AuthorizeAttribute());

            JsonSerializerSettings settings = GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings;

#if DEBUG
            settings.Formatting = Formatting.Indented;
#endif
            settings.ContractResolver = new CamelCasePropertyNamesContractResolver();
        }
    }
}
