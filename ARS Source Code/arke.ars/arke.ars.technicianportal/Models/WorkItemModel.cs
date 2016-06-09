using System;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class WorkItemModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public bool IsComplete { get; set; }
    }
}