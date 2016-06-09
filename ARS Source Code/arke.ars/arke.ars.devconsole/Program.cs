using System;
using System.Linq;
using Arke.ARS.Organization.Context;
using Microsoft.Xrm.Client;
using Microsoft.Xrm.Client.Services;

namespace Arke.ARS.DevConsole
{
    public static class Program
    {
        private static readonly Random Random = new Random();
        private static IArsOrganizationContext _context;

        public static void Main(string[] args)
        {
            _context = CreateOrganizationContext();
            CreateWorkOrdersForToday();
        }

        private static void CreateWorkOrdersForToday()
        {
            ars_technician technician = _context.ars_technicianSet.First(t => t.EmailAddress == "gw@example.org");
            Incident workOrder = _context.IncidentSet.First(t => t.Title == "Fix This Now!!");
            Service service = _context.ServiceSet.First(t => t.Name == "General Service");

            DateTime now = DateTime.UtcNow;

            _context.AddObject(new ServiceAppointment
            {
                ScheduledStart = now,
                ScheduledEnd = now.AddHours(2),
                ServiceId = service.ToEntityReference(),
                RegardingObjectId = workOrder.ToEntityReference(),
                ars_Technician = technician.ToEntityReference(),
                Subject = "WO-" + Random.Next(10000, 99999) + "-" + Random.GetRandomAlpahnumeric(6)
            });

            _context.SaveChanges();
        }

        private static IArsOrganizationContext CreateOrganizationContext()
        {
            var connection = new CrmConnection("ArsOrg");
            var org = new OrganizationService(connection);
            var xrm = new ArsOrganizationContext(org);
            return xrm;
        }
    }
}
