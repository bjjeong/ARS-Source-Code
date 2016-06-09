using Arke.ARS.TechnicianPortal.Models;

namespace Arke.ARS.TechnicianPortal.Services
{
    public sealed class GetAppointmentsResult
    {
        public AppointmentModel[] Appointments { get; set; }

        public bool HaveWorkForTomorrow { get; set; }
    }
}