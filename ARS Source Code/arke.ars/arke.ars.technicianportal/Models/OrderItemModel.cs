using System;
using System.ComponentModel.DataAnnotations;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class OrderItemModel
    {
        [Required]
        public string Item { get; set; }

        [Range(0, Int64.MaxValue)]
        public decimal Quantity { get; set; }

        [Range(0, Int64.MaxValue)]
        public decimal beforeTaxPrice { get; set; }

        [Range(0, Int64.MaxValue)]
        public decimal Price { get; set; }

        [Range(0, Int64.MaxValue)]
        public decimal RealPrice { get; set; }
    }
}