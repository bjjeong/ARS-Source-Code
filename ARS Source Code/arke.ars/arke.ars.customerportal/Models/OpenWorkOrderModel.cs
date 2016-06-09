using System;
using System.Collections.Generic;

namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class OpenWorkOrderModel
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; }
        public string Location { get; set; }
        public string Title { get; set; }
        public DateTime? NeedBy { get; set; }
        public string Status { get; set; }

        public override bool Equals(object obj)
        {
            return Equals(obj as OpenWorkOrderModel);
        }

        private bool Equals(OpenWorkOrderModel other)
        {
            if (other == null)
            {
                return false;
            }

            return Id.Equals(other.Id)
                && string.Equals(OrderNumber, other.OrderNumber)
                && string.Equals(Location, other.Location)
                && string.Equals(Title, other.Title)
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
                return hashCode;
            }
        }

        public static readonly IEqualityComparer<OpenWorkOrderModel> Comparer = new OpenWorkOrderModelEqualityComparer();

        private sealed class OpenWorkOrderModelEqualityComparer : IEqualityComparer<OpenWorkOrderModel>
        {
            public bool Equals(OpenWorkOrderModel x, OpenWorkOrderModel y)
            {
                return x.Equals(y);
            }

            public int GetHashCode(OpenWorkOrderModel obj)
            {
                return obj.GetHashCode();
            }
        }

    }
}