using System;
using System.Collections.Generic;

namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class LocationModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        private bool Equals(LocationModel other)
        {
            if (other == null)
            {
                return false;
            }

            return Id.Equals(other.Id) && string.Equals(Name, other.Name);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                return (Id.GetHashCode() * 397) ^ (Name != null ? Name.GetHashCode() : 0);
            }
        }

        public override bool Equals(object obj)
        {
            return Equals(obj as LocationModel);
        }

        public static readonly IEqualityComparer<LocationModel> Comparer = new LocationModelEqualityComparer();

        private sealed class LocationModelEqualityComparer : IEqualityComparer<LocationModel>
        {
            public bool Equals(LocationModel x, LocationModel y)
            {
                return x.Equals(y);
            }

            public int GetHashCode(LocationModel obj)
            {
                return obj.GetHashCode();
            }
        }
    }
}