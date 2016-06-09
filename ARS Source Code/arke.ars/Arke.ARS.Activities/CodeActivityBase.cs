using System;
using System.Activities;
using System.Text;
using Arke.ARS.Organization.Context;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;

namespace Arke.ARS.Activities
{
    public abstract class CodeActivityBase : CodeActivity
    {
        protected override void CacheMetadata(CodeActivityMetadata metadata)
        {
            base.CacheMetadata(metadata);

            metadata.AddDefaultExtensionProvider(() => (IServiceContextFactory)new DefaultServiceContextFactory());
        }

        protected override void Execute(CodeActivityContext executionContext)
        {
            var tracingService = executionContext.GetExtension<ITracingService>();
            var workflowContext = executionContext.GetExtension<IWorkflowContext>();
            if (workflowContext == null)
            {
                throw new InvalidOperationException("Wokflow Context is null");
            }

            IArsOrganizationContext serviceContext = null;

            try
            {
                var serviceFactory = executionContext.GetExtension<IOrganizationServiceFactory>();
                IOrganizationService service = serviceFactory.CreateOrganizationService(workflowContext.UserId);

                serviceContext = executionContext.GetExtension<IServiceContextFactory>().CreateContext(service);
                HandleRequest(executionContext, serviceContext, workflowContext);
            }
            catch (Exception ex)
            {
                ThrowException(ex, tracingService, workflowContext);
            }
            finally
            {
                var disposable = serviceContext as IDisposable;
                if (disposable != null)
                {
                    disposable.Dispose();
                }
            }
        }

        private void ThrowException(Exception ex, ITracingService tracingService, IWorkflowContext workflowContext)
        {
            var exceptionInfo = new StringBuilder();
            exceptionInfo.AppendLine();
            exceptionInfo.AppendLine("==========================  Exception info see below  ===============================");
            exceptionInfo.AppendFormat("Execution context info. Message: {0}; Depth: {1}; Entity: {2}. Assembly name: {3}", workflowContext.MessageName, workflowContext.Depth, workflowContext.PrimaryEntityName, GetType().Assembly.FullName);
            exceptionInfo.AppendLine();
            exceptionInfo.AppendLine(GetExceptionInfo(ex));
            tracingService.Trace(exceptionInfo.ToString());

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

        protected abstract void HandleRequest(CodeActivityContext executionContext, IArsOrganizationContext serviceContext, IWorkflowContext workflowContext);
    }
}