using Arke.ARS.Organization.Context;
using Microsoft.Xrm.Client;
using Microsoft.Xrm.Client.Services;

namespace Arke.ARS.CommonWeb.Services
{
    public sealed class ArsContextFactory
    {
        public IArsOrganizationContext CreateContext()
        {
            var connection = new CrmConnection("ArsOrg");
            var org = new OrganizationService(connection);
            var xrm = new AttributeTrackingDomainContext(org);
            return xrm;
        } 
    }
}