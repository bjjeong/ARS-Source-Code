using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Organization.Context
{
    public interface IServiceContextFactory
    {
        IArsOrganizationContext CreateContext(IOrganizationService service);
    }
}