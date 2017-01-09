using System;
using System.Linq;
using Arke.ARS.Organization.Context;
using Microsoft.Crm.Sdk.Messages;

namespace Arke.ARS.CommonWeb.Services.Impl
{
    public sealed class TimeService : ITimeService
    {
        private readonly IArsOrganizationContext _context;
        private readonly Lazy<int> _timeZoneCode;

        public TimeService(IArsOrganizationContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            _context = context;
            _timeZoneCode = new Lazy<int>(GetCurrentUserTimeZoneCode);
        }

        public DateTime ConvertUtcTimeToUserTime(DateTime utcDate)
        {
            // Get the local time zone and the current local time and year.
            TimeZone localZone = TimeZone.CurrentTimeZone;
            string timezone = localZone.StandardName;

            var response = (LocalTimeFromUtcTimeResponse)_context.Execute(new LocalTimeFromUtcTimeRequest
            {
                TimeZoneCode = _timeZoneCode.Value,
                UtcTime = utcDate
            });

            return response.LocalTime;
        }

        private int GetCurrentUserTimeZoneCode()
        {
            var response = (WhoAmIResponse) _context.Execute(new WhoAmIRequest());
            int? timeZoneCode = _context.UserSettingsSet.Where(s => s.SystemUserId == response.UserId).Select(s => s.TimeZoneCode).First();
            return timeZoneCode.Value;
        }
    }
}