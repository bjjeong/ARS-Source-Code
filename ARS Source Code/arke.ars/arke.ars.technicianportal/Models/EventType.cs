using System.ComponentModel;

namespace Arke.ARS.TechnicianPortal.Models
{
    public enum EventType
    {
        [Description("Status Change")]
        StatusChange,
        [Description("Check In")]
        CheckIn,
        [Description("Check Out")]
        CheckOut,
        [Description("NTE Increase Request")]
        NteIncreaseRequest,
        [Description("Lunch")]
        Lunch,
    }
}