using System;
using System.ComponentModel.DataAnnotations;
using System.Web;

namespace Arke.ARS.TechnicianPortal.Models
{
    public class ApplicationModel
    {
        public string CompanyName { get; set; }
        public string ContactFirstName { get; set; }
        public string ContactLastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string StreetAddress { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Website { get; set; }
        public bool IVR { get; set; }
        public bool Photos { get; set; }
        public bool Emergency { get; set; }
        public string ServiceArea { get; set; }
        public string Body { get; set; }
    }
}