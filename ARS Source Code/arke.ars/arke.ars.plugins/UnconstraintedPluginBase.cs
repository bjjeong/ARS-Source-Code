using System;
using System.ServiceModel;
using System.Text;
using Arke.ARS.Organization.Context;
using Arke.ARS.Organization.Services;
using Arke.ARS.Organization.Services.Impl;
using Arke.Crm.Utils.Infrastructure.OptionSet;
using Arke.Crm.Utils.IoC;
using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Plugins
{
    public abstract class UnconstraintedPluginBase : IPlugin
    {
        private IContainerFactory _containerFactory;

        internal IContainerFactory ContainerFactory
        {
            get
            {
                if (_containerFactory == null)
                {
                    _containerFactory = new DefaultContainerFactory();
                }

                return _containerFactory;
            }

            set
            {
                _containerFactory = value;
            }
        }

        protected IContainer Container { get; private set; }

        protected IArsOrganizationContext ArsOrganizationContext
        {
            get { return Container.Resolve<IArsOrganizationContext>(); }
        }

        protected IPluginExecutionContext Context { get; private set; }

        protected int ExecutionRecursionDepth { get; private set; }

        protected ITracingService Trace { get; private set; }

        public void Execute(IServiceProvider serviceProvider)
        {
            Trace = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            try
            {
                Context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
                ExecutionRecursionDepth = Context.Depth;

                Container = ContainerFactory.CreateContainer();
                RegisterFrequentlyUsedDependencies(Container, serviceProvider);

                EnvironmentInitialized();
                RegisterDependencies(Container);
                HandleRequest();
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                OrganizationServiceFault fault = ex.Detail;
                while (fault != null)
                {
                    Trace.Trace(fault.Message);
                    fault = fault.InnerFault;
                }

                ThrowException(ex);
            }
            catch (SaveChangesException ex)
            {
                ThrowException(ex.InnerException ?? ex);
            }
            catch (Exception ex)
            {
                ThrowException(ex);
            }
            finally
            {
                if (Container != null)
                {
                    Container.Dispose();
                    Container = null;
                }
            }
        }

        private void RegisterFrequentlyUsedDependencies(IContainer container, IServiceProvider serviceProvider)
        {
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(Context.UserId);

            Container.Register<IServiceContextFactory, DefaultServiceContextFactory>();
            Container.Register<IArsOrganizationContext, IArsOrganizationContext>(() => container.Resolve<IServiceContextFactory>().CreateContext(service));
            Container.Register<ITracingService, ITracingService>(() => Trace);
            Container.Register<ISettingsService, SettingsService>();
            Container.Register<IOptionSetHelper, OptionSetHelper>();
        }

        protected abstract void HandleRequest();

        protected virtual void EnvironmentInitialized()
        {
        }

        protected virtual void RegisterDependencies(IContainer container)
        {
        }

        private void ThrowException(Exception ex)
        {
            var exceptionInfo = new StringBuilder();
            exceptionInfo.AppendLine();
            exceptionInfo.AppendLine("==========================  Exception info see below  ===============================");
            exceptionInfo.AppendFormat("Execution context info. Message: {0}; Depth: {1}; Stage: {2}; Assembly: {3}", Context.MessageName, Context.Depth, Context.Stage, GetType().FullName);
            exceptionInfo.AppendLine();
            exceptionInfo.AppendLine(GetExceptionInfo(ex));
            Trace.Trace(exceptionInfo.ToString());

            throw new InvalidPluginExecutionException(ex.Message, ex);
        }

        private static string GetExceptionInfo(Exception ex)
        {
            var info = new StringBuilder();
            Exception currentException = ex;
            while (currentException != null)
            {
                info.AppendFormat("{0} - {1}", currentException.GetType(), currentException.Message);
                info.AppendLine();
                info.AppendLine(currentException.StackTrace);
                currentException = currentException.InnerException;
            }

            return info.ToString();
        }
    }
}