using System;

namespace Arke.ARS.CustomerPortal.Models
{
    public class ClosedWorkOrderModel
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; }
        public string Location { get; set; }
        public string Title { get; set; }
        public DateTime? ClosedDate { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
        public string Tech { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Trade { get; set; }
        public Guid LocationId { get; set; } 
    }
}