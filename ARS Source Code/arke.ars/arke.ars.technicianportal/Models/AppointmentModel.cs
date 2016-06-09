using System;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class AppointmentModel
    {
        public Guid Id { get; set; }

        public DateTime Start { get; set; }

        public DateTime End { get; set; }

        public string TicketNumber { get; set; }

        public string Address { get; set; }

        public string Subject { get; set; }

        public string Phone { get; set; }

        public Guid WorkOrderId { get; set; }
    }
}