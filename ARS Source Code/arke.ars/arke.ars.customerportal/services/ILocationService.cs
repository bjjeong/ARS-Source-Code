using System;
using System.Collections.Generic;
using Arke.ARS.CustomerPortal.Models;

namespace Arke.ARS.CustomerPortal.Services
{
    public interface ILocationService
    {
        IEnumerable<LocationModel> GetLocations(Guid customerId);
        IEnumerable<LocationModel> GetSingleLocation(Guid customerId);
        void AddLocationNotes(Guid locationId, string comment);
    }
}