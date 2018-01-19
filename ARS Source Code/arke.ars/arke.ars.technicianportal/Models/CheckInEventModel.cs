using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class CheckInEventModel
    {
        [Required]
        public string EventType { get; set; }

        [Required]
        public DateTime? Time { get; set; }
    }
}