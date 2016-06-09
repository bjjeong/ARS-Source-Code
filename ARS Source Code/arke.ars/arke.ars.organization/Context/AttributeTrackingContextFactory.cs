using System;
using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Organization.Context
{
    public sealed class AttributeTrackingContextFactory : IServiceContextFactory
    {
        public IArsOrganizationContext CreateContext(IOrganizationService service)
        {
            if (service == null)
            {
                throw new ArgumentNullException("service");
            }

            return new AttributeTrackingDomainContext(service);
        }
    }
}