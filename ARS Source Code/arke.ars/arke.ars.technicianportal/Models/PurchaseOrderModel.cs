﻿using System;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class PurchaseOrderModel
    {
        public string Description { get; set; }

        public int Quantity { get; set; }

        public string Price { get; set; }

        public string PO { get; set; }

        public string RealPrice { get; set; }

        public string Vendor { get; set; }

        public bool Receipt { get; set; }

        public string Card { get; set; }
    }
}