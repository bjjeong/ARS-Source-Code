using System;
using System.Collections.Generic;
using System.Linq;
using Arke.ARS.CommonWeb.Services;
using Arke.ARS.Organization.Context;
using Arke.ARS.TechnicianPortal.Models;

namespace Arke.ARS.TechnicianPortal.Services.Impl
{
    public sealed class AppointmentService : IAppointmentService
    {
        private readonly IArsOrganizationContext _context;
        private readonly ITimeService _timeService;

        public AppointmentService(IArsOrganizationContext context, ITimeService timeService)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (timeService == null)
            {
                throw new ArgumentNullException("timeService");
            }

            _context = context;
            _timeService = timeService;
        }

        public GetAppointmentsResult GetAppointments(DateTime start, DateTime end, Guid technicianId)
        {
            start = ToUtcKind(start);
            end = ToUtcKind(end);

            var data = (from a in _context.ServiceAppointmentSet
                join incident in _context.IncidentSet on a.Incident_ServiceAppointments.Id equals incident.IncidentId
                        join account in _context.AccountSet on incident.ars_Location.Id equals account.AccountId
                where
                    (a.ScheduledStart >= start && a.ScheduledStart <= end) ||
                    (a.ScheduledEnd >= start && a.ScheduledEnd <= end)
                where a.ars_Technician.Id == technicianId
                select new { Customer = account, Appointment = a, Incident = incident}).ToArray();

            var models = new List<AppointmentModel>();

            var result = new GetAppointmentsResult
            {
                HaveWorkForTomorrow = data.Any(d => d.Appointment.ScheduledEnd > end)
            };

            foreach (var d in data)
            {
                models.Add(new AppointmentModel
                {
                    Start = _timeService.ConvertUtcTimeToUserTime(d.Appointment.ScheduledStart.Value),
                    End = _timeService.ConvertUtcTimeToUserTime(d.Appointment.ScheduledEnd.Value),
                    Id = d.Appointment.Id,
                    TicketNumber = d.Incident.TicketNumber,
                    Address = d.Customer.Address1_Composite,
                    Phone = d.Customer.Telephone1 ?? d.Customer.Telephone2 ?? d.Customer.Telephone3,
                    Subject = d.Appointment.Subject,
                    WorkOrderId = d.Incident.IncidentId.Value
                });
            }

            result.Appointments = models.ToArray();
            return result;
        }

        private DateTime ToUtcKind(DateTime date)
        {
            if (date.Kind == DateTimeKind.Local)
            {
                return date.ToUniversalTime();
            }

            if (date.Kind == DateTimeKind.Utc)
            {
                return date;
            }

            return new DateTime(date.Year, date.Month, date.Day, date.Hour, date.Minute, date.Second, date.Millisecond, DateTimeKind.Utc);
        }
    }
}