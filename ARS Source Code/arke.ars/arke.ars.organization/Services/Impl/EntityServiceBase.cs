using System;
using Arke.ARS.Organization.Context;

namespace Arke.ARS.Organization.Services.Impl
{
    public abstract class EntityServiceBase
    {
        private readonly IArsOrganizationContext _context;

        protected EntityServiceBase(IArsOrganizationContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            _context = context;
        }

        protected IArsOrganizationContext Context
        {
            get
            {
                return _context;
            }
        }
    }
}