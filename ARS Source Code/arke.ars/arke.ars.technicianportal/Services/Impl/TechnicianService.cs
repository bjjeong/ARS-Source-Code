using System;
using System.Linq;
using System.Runtime.Caching;
using Arke.ARS.Organization.Context;

namespace Arke.ARS.TechnicianPortal.Services.Impl
{
    public sealed class TechnicianService : ITechnicianService
    {
        private readonly IArsOrganizationContext _context;
        private readonly ObjectCache _cache;

        public TechnicianService(IArsOrganizationContext context, ObjectCache cache)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (cache == null)
            {
                throw new ArgumentNullException("cache");
            }

            _context = context;
            _cache = cache;
        }

        public string GetTechnicianName(Guid technicianId)
        {
            string cacheKey = technicianId.ToString();

            if (_cache.Contains(cacheKey))
            {
                return (string) _cache[cacheKey];
            }

            string techName = _context.ars_technicianSet.Where(t => t.Id == technicianId).Select(t => t.ars_FirstName + " " + t.ars_LastName).First();

            _cache.Add(cacheKey, techName, new CacheItemPolicy
            {
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });

            return techName;
        }
    }
}