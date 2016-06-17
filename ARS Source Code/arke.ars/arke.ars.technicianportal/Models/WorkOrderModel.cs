using System;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class WorkOrderModel
    {
        public WorkOrderModel()
        {
            WorkItems = new WorkItemModel[0];
        }

        public Guid Id { get; set; }
        public string Title { get; set; }
        public string TicketNumber { get; set; }
        public string Description { get; set; } 
        public bool IsInProgress { get; set; }
        public CustomerModel Customer { get; set; }
        public decimal RemainingHours { get; set; }
        public decimal NteHours { get; set; }
        public decimal RemainingMoney { get; set; }
        public decimal NteMoney { get; set; }
        public WorkItemModel[] WorkItems { get; set; }
        public string TradeType { get; set; }
        public string trade { get; set; }
        public string po { get; set; }
    }
}