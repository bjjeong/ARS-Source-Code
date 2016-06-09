using System;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class NteIncreaseRequestModel
    {
        public Guid WorkOrderId { get; set; }

        public decimal Money { get; set; }

        public decimal Hours { get; set; }
    }
}