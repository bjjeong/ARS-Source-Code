using System;
using System.ComponentModel.DataAnnotations;
using System.Web;

namespace Arke.ARS.CustomerPortal.Models
{
    public class NewWorkOrderModel
    {
        [Required]
        public Guid Locations { get; set; }
        [Required]
        public string Title { get; set; }
        public decimal Nte { get; set; }
        public DateTime NeedByDate { get; set; }
        public string Description { get; set; }
        public HttpPostedFileBase Attachment { get; set; }
        public string PO { get; set; }
    }
}