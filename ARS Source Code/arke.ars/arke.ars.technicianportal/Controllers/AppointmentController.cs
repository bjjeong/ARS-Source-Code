using System;
using System.Security.Claims;
using System.Web.Http;
using Arke.ARS.TechnicianPortal.Services;
using Microsoft.AspNet.Identity;

namespace Arke.ARS.TechnicianPortal.Controllers
{
    public sealed class AppointmentController : ApiController
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentController(IAppointmentService appointmentService)
        {
            if (appointmentService == null)
            {
                throw new ArgumentNullException("appointmentService");
            }

            _appointmentService = appointmentService;
        }

        public GetAppointmentsResult Get(DateTime start, DateTime end)
        {
            Guid technicianId = GetTechnicianId();
            GetAppointmentsResult result = _appointmentService.GetAppointments(start, end, technicianId);
            return result;
        }

        private Guid GetTechnicianId()
        {
            var identity = (ClaimsIdentity) User.Identity;
            Guid technicianId = Guid.Parse(identity.GetUserId());
            return technicianId;
        }
    }
}
