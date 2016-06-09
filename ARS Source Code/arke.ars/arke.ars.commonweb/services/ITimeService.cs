using System;

namespace Arke.ARS.CommonWeb.Services
{
    public interface ITimeService
    {
        DateTime ConvertUtcTimeToUserTime(DateTime utcDate);
    }
}