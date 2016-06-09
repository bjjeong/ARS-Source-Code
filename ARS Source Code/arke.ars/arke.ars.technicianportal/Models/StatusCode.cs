using System.ComponentModel;

namespace Arke.ARS.TechnicianPortal.Models
{
    public enum StatusCode
    {
        [Description("In Progress")]
        InProgress,

        [Description("Work Complete")]
        WorkComplete,

        [Description("Technician Offsite")]
        TechnicianOffsite,

        [Description("Return - Need to Quote")]
        ReturnNeedToQuote,

        [Description("Return - Need for Parts")]
        ReturnNeedForParts
    }
}