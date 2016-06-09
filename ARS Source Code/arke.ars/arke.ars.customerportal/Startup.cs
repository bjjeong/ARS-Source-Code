using System;
using System.Reflection;
using System.Runtime.Caching;
using System.Web.Http;
using System.Web.Http.ExceptionHandling;
using System.Web.Mvc;
using Arke.ARS.CommonWeb.Providers;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.CommonWeb.Services.Impl;
using Arke.ARS.CustomerPortal;
using Arke.ARS.CustomerPortal.Services;
using Arke.ARS.CustomerPortal.Services.Impl;
using Arke.ARS.Organization.Context;
using Arke.Crm.Utils;
using Arke.Crm.Utils.Infrastructure.OptionSet;
using Autofac;
using Autofac.Integration.Mvc;
using Autofac.Integration.WebApi;
using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using Owin;

[assembly: OwinStartup(typeof(Startup))]

namespace Arke.ARS.CustomerPortal
{
    public sealed class Startup
    {
        private IContainer _container;

        public void Configuration(IAppBuilder app)
        {
            ConfigureAutofacContainer();
            ConfigureAuth(app);
        }

        private void ConfigureAutofacContainer()
        {
            var builder = new ContainerBuilder();

            builder.RegisterApiControllers(Assembly.GetExecutingAssembly());
            builder.RegisterWebApiFilterProvider(GlobalConfiguration.Configuration);
            builder.RegisterControllers(Assembly.GetExecutingAssembly());
            builder.RegisterType<ArsContextFactory>().AsSelf().SingleInstance();
            builder.RegisterType<Logger>().As<ILogger>().SingleInstance();
            builder.RegisterInstance(MemoryCache.Default).As<ObjectCache>();
            builder.RegisterType<WebApiExceptionLogger>().As<IExceptionLogger>().InstancePerLifetimeScope();
            builder.Register(c => c.Resolve<ArsContextFactory>().CreateContext()).InstancePerLifetimeScope();
            builder.RegisterType<CrmCustomerAuthenticationService>().As<IAuthenticationService>().InstancePerLifetimeScope();
            builder.RegisterType<WorkOrderService>().As<IWorkOrderService>().InstancePerLifetimeScope();
            builder.RegisterType<LocationService>().As<ILocationService>().InstancePerLifetimeScope();
            builder.RegisterType<AttachmentService>().As<IAttachmentService>().InstancePerLifetimeScope();
            builder.RegisterType<CustomerService>().As<ICustomerService>().InstancePerLifetimeScope();
            builder.RegisterType<TimeService>().As<ITimeService>().InstancePerLifetimeScope();
            builder.RegisterType<OptionSetHelper>().As<IOptionSetHelper>().InstancePerLifetimeScope();
            builder.Register(c => (IOrganizationServiceContext)c.Resolve<IArsOrganizationContext>()).InstancePerLifetimeScope();
            _container = builder.Build();

            DependencyResolver.SetResolver(new AutofacDependencyResolver(_container));
            GlobalConfiguration.Configuration.DependencyResolver = new AutofacWebApiDependencyResolver(_container);
        }

        public void ConfigureAuth(IAppBuilder app)
        {
            // Enable the application to use a cookie to store information for the signed in user
            // and to use a cookie to temporarily store information about a user logging in with a third party login provider
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                LoginPath = new PathString("/account/signin")
            });

            // Enable the application to use bearer tokens to authenticate users
            app.UseOAuthBearerTokens(new OAuthAuthorizationServerOptions
            {
                TokenEndpointPath = new PathString("/Token"),
                Provider = new ApplicationOAuthProvider("self", _container.Resolve<IAuthenticationService>()),
                AccessTokenExpireTimeSpan = TimeSpan.FromDays(14),
                AllowInsecureHttp = true
            });
        }
    }
}