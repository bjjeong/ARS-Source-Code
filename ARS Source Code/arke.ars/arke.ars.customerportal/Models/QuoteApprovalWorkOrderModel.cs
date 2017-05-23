using System;
using System.Collections.Generic;

namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class QuoteApprovalWorkOrderModel
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; }
        public string Location { get; set; }
        public string Title { get; set; }
        public DateTime? NeedBy { get; set; }
        public string Status { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public int Priority { get; set; }
        public string Trade { get; set; }
        public Guid LocationId { get; set; }

        public override bool Equals(object obj)
        {
            return Equals(obj as QuoteApprovalWorkOrderModel);
        }

        private bool Equals(QuoteApprovalWorkOrderModel other)
        {
            if (other == null)
            {
                return false;
            }

            return Id.Equals(other.Id)
                && string.Equals(OrderNumber, other.OrderNumber)
                && string.Equals(Location, other.Location)
                && string.Equals(Title, other.Title)
                && string.Equals(City, other.City)
                && string.Equals(State, other.State)
                && int.Equals(Priority, other.Priority)
                && string.Equals(Trade, other.Trade)
                && NeedBy.Equals(other.NeedBy)
                && string.Equals(Status, other.Status);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                int hashCode = Id.GetHashCode();
                hashCode = (hashCode * 397) ^ (OrderNumber != null ? OrderNumber.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ (Location != null ? Location.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ (Title != null ? Title.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ NeedBy.GetHashCode();
                hashCode = (hashCode * 397) ^ (Status != null ? Status.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ (City != null ? City.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ (State != null ? State.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ (Trade != null ? Trade.GetHashCode() : 0);
                return hashCode;
            }
        }

        public static readonly IEqualityComparer<QuoteApprovalWorkOrderModel> Comparer = new QuoteApprovalWorkOrderModelEqualityComparer();

        private sealed class QuoteApprovalWorkOrderModelEqualityComparer : IEqualityComparer<QuoteApprovalWorkOrderModel>
        {
            public bool Equals(QuoteApprovalWorkOrderModel x, QuoteApprovalWorkOrderModel y)
            {
                return x.Equals(y);
            }

            public int GetHashCode(QuoteApprovalWorkOrderModel obj)
            {
                return obj.GetHashCode();
            }
        }

    }
}