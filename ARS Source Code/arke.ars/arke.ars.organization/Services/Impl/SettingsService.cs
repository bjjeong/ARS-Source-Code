using System;
using System.Linq;
using Arke.ARS.Organization.Context;
using Arke.Crm.Utils.Exceptions;

namespace Arke.ARS.Organization.Services.Impl
{
    public sealed class SettingsService : EntityServiceBase, ISettingsService
    {
        public SettingsService(IArsOrganizationContext context)
            : base(context)
        {
        }

        public string GetSettingValueByName(string settingName)
        {
            if (String.IsNullOrWhiteSpace(settingName))
            {
                throw new ArgumentNullException("settingName");
            }

            try
            {
                ars_arssetting settings = Context.ars_arssettingSet.Single(s => s.ars_name == settingName);
                return settings.ars_Value;
            }
            catch (Exception ex)
            {
                throw new EntityNotFoundException(String.Format("Cannot find FRM setting by name '{0}'", settingName), ex);
            }
        }
    }
}
