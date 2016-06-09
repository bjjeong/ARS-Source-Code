using System;
using System.Text;

namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class WorkOrderDetailsModel
    {
        public WorkOrderDetailsModel()
        {
            Activities = new ActivityModel[0];
            Orders = new OrderModel[0];
        }

        public Guid Id { get; set; }

        public string Name { get; set; }

        public DateTime CreatedOn { get; set; }

        public DateTime? ScheduledOn { get; set; }

        public string Location { get; set; }

        public ActivityModel[] Activities { get; set; }

        public OrderModel[] Orders { get; set; }

        public AddressModel LocationAddress { get; set; }

        public string PurchaseOrderNumber { get; set; }

        public string DescriptionOfService { get; set; }

        public decimal Nte { get; set; }

        public string TicketNumber { get; set; }

        public string Status { get; set; }
    }

    public sealed class AddressModel
    {
        public string Address1 { get; set; }

        public string Address2 { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string PostalCode { get; set; }

        public string GetCityLine()
        {
            var sb = new StringBuilder();

            bool hasCity = false;
            if (!String.IsNullOrWhiteSpace(City))
            {
                hasCity = true;
                sb.Append(City);
            }

            bool hasState = false;
            if (!String.IsNullOrWhiteSpace(State))
            {
                hasState = true;

                if (hasCity)
                {
                    sb.Append(", ");
                }

                sb.Append(State);
            }

            if (!String.IsNullOrWhiteSpace(PostalCode))
            {
                if (hasCity || hasState)
                {
                    sb.Append(' ');
                }

                sb.Append(PostalCode);
            }

            return sb.ToString();
        }
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