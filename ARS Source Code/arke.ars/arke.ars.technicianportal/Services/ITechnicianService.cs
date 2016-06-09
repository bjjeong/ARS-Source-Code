using System;

namespace Arke.ARS.TechnicianPortal.Services
{
    public interface ITechnicianService
    {
        string GetTechnicianName(Guid technicianId);
    }
}