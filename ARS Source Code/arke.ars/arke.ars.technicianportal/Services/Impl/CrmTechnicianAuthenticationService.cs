using System;
using System.Linq;
using System.Security.Claims;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.CommonWeb.Services.Impl;
using Arke.ARS.Organization.Context;
using Microsoft.AspNet.Identity;

namespace Arke.ARS.TechnicianPortal.Services.Impl
{
    public sealed class CrmTechnicianAuthenticationService : IAuthenticationService
    {
        private readonly IArsOrganizationContext _context;

        public CrmTechnicianAuthenticationService(IArsOrganizationContext context)
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

            var technicianEntity = _context.ars_technicianSet
                .Where(t => t.EmailAddress == name)
                .ToArray()
                .FirstOrDefault(t => string.Equals(t.ars_Password, password, StringComparison.Ordinal));
            var  technician =technicianEntity!=null?
                new SimpleUser
                {
                    Id = technicianEntity.Id,
                    UserName = technicianEntity.ars_FirstName + " " + technicianEntity.ars_LastName
                }:null;
            _context.Detach(technicianEntity);

            return technician;
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