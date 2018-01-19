using System;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class WorkOrderModel
    {
        public WorkOrderModel()
        {
            WorkItems = new WorkItemModel[0];
            Activities = new ActivityModel[0];
            Orders = new OrderModel[0]; 
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
        public bool new_nteincrease { get; set; }
        public ActivityModel[] Activities { get; set; }
        public OrderModel[] Orders { get; set; }
        public OrderItemModel[] OrderItem { get; set; }
        public CheckInEventModel[] CheckInEvent { get; set; }
        public CheckOutEventModel[] CheckOutEvent { get; set; }
    }

    public sealed class OrderModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public DateTime CreatedOn { get; set; }

        public decimal Amount { get; set; }

        public string Status { get; set; }
    }

    public sealed class ActivityModel
    {
        public ActivityModel()
        {
            Attachments = new AttachmentModel[0];
        }

        public Guid Id { get; set; }

        public DateTime CreatedOn { get; set; }

        public string Description { get; set; }

        public AttachmentModel[] Attachments { get; set; }
    }

    public sealed class AttachmentModel
    {
        public string FileName { get; set; }

        public Guid Id { get; set; }
    }
}