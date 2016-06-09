using System;
using System.Collections.Generic;
using System.Linq;
using Arke.ARS.CustomerPortal.Models;
using Arke.ARS.Organization.Context;

namespace Arke.ARS.CustomerPortal.Services.Impl
{
    public sealed class LocationService : ILocationService
    {
        private readonly IArsOrganizationContext _context;

        public LocationService(IArsOrganizationContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            _context = context;
        }

        public IEnumerable<LocationModel> GetLocations(Guid customerId)
        {
            var directlyRelatedLocations = (from location in _context.AccountSet
                join customer in _context.ContactSet on location.AccountId equals customer.ParentCustomerId.Id
                where customer.ContactId == customerId
                where location.new_AllowService == true
                select new LocationModel
                {
                    Id = location.AccountId.Value,
                    Name = location.Name
                }).ToArray();

            var indirectlyRelatedLocations = (from customer in _context.ContactSet
                join business in _context.AccountSet on customer.ParentCustomerId.Id equals business.AccountId
                join location in _context.AccountSet on business.AccountId equals location.ParentAccountId.Id
                where customer.ContactId == customerId
                where location.new_AllowService == true
                select new LocationModel
                {
                    Id = location.AccountId.Value,
                    Name = location.Name
                }).ToArray();

            return directlyRelatedLocations.Union(indirectlyRelatedLocations, LocationModel.Comparer).OrderBy(l => l.Name);
        }
    }
}