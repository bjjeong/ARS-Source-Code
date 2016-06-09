using System;
using System.Linq;
using Arke.ARS.Organization.Context;

namespace Arke.ARS.CustomerPortal.Services.Impl
{
    public sealed class CustomerService : ICustomerService
    {
        private readonly IArsOrganizationContext _context;

        public CustomerService(IArsOrganizationContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            _context = context;
        }

        public string GetCustomerName(Guid customerId)
        {
            return (from contact in _context.ContactSet
                where contact.Id == customerId
                select contact.FullName).First();
        }
    }
}