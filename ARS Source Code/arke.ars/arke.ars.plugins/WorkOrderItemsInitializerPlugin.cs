using System.Collections.Generic;
using System.Linq;
using Arke.ARS.Organization.Context;
using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Plugins
{
    /// <summary>
    /// Plugin that copies work items from the Account to the Work Order.
    /// Plugin must be registered with one step:
    /// "Create" message for <see cref="Incident"/> entity(on Post-operation)
    /// </summary>
    public sealed class WorkOrderItemsInitializerPlugin : PluginBase<Incident>, IPlugin
    {
        protected override void HandleRequest()
        {
            var customerId = Target.CustomerId;
            if (customerId == null || customerId.LogicalName != Account.EntityLogicalName)
            {
                return;
            }

            var templateWorkItems = from workItem in ArsOrganizationContext.ars_workitemSet
                join business in ArsOrganizationContext.AccountSet on workItem.ars_AccountId.Id equals business.AccountId
                join location in ArsOrganizationContext.AccountSet on business.AccountId equals location.ParentAccountId.Id
                join workorder in ArsOrganizationContext.IncidentSet on location.AccountId equals workorder.CustomerId.Id
                where workorder.CustomerId.Id == customerId.Id
                select new { Name = workItem.ars_name };

            var workItemNames = new HashSet<string>();
            foreach (var templateWorkItem in templateWorkItems)
            {
                workItemNames.Add(templateWorkItem.Name);
            }

            foreach (var name in workItemNames)
            {
                ArsOrganizationContext.AddObject(new ars_workitem
                {
                    ars_name = name,
                    ars_WorkOrderId = Target.ToEntityReference()
                });
            }
            ArsOrganizationContext.SaveChanges();
        }
    }
}