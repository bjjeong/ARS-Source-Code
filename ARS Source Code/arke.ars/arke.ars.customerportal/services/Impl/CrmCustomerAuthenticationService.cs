using System;
using System.Linq;
using System.Security.Claims;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.CommonWeb.Services.Impl;
using Arke.ARS.Organization.Context;
using Microsoft.AspNet.Identity;

namespace Arke.ARS.CustomerPortal.Services.Impl
{
    public sealed class CrmCustomerAuthenticationService : IAuthenticationService
    {
        private readonly IArsOrganizationContext _context;

        public CrmCustomerAuthenticationService(IArsOrganizationContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            _context = context;
        }

        public IUser<Guid> FindUser(string name, string password)
        {
            if (String.IsNullOrWhiteSpace(name))
            {
                throw new ArgumentNullException("name");
            }

            if (password == null)
            {
                throw new ArgumentNullException("password");
            }
            var customerEntity = _context.ContactSet
                .Where(c => c.ars_CustomerPortalUsername == name)
                .ToArray()
                .FirstOrDefault(c => string.Equals(c.ars_CustomerPortalPassword, password, StringComparison.Ordinal));
            var customer = customerEntity!=null? new SimpleUser
                {
                    Id = customerEntity.Id,
                    UserName = customerEntity.FullName
                }:null;

            _context.Detach(customerEntity);

            return customer;
        }

        public ClaimsIdentity CreateIdentity(IUser<Guid> user, string authenticationType)
        {
            var claims = new ClaimsIdentity(authenticationType);
            claims.AddClaim(new Claim(ClaimTypes.Name, user.UserName));
            claims.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            claims.AddClaim(new Claim(ClaimTypes.System, "CRM"));

            return claims;
        }
    }
}