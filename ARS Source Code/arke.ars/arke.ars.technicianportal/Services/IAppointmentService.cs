using System;

namespace Arke.ARS.TechnicianPortal.Services
{
    public interface IAppointmentService
    {
        GetAppointmentsResult GetAppointments(DateTime start, DateTime end, Guid technicianId);
    }
}