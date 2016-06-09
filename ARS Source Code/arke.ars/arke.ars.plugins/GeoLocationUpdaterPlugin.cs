using System;
using Arke.ARS.Organization.Context;
using Arke.ARS.Organization.Services;
using Arke.Crm.GeoLocation;
using Arke.Crm.GeoLocation.Configuration;
using Arke.Crm.GeoLocation.Configuration.Xml;
using Arke.Crm.GeoLocation.Impl;
using Arke.Crm.Utils.Infrastructure.Metadata.Impl;
using Arke.Crm.Utils.Infrastructure.OptionSet;
using Arke.Crm.Utils.Infrastructure.OptionSet.Parsing;
using Arke.Crm.Utils.IoC;
using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Plugins
{
    /// <summary>
    /// Plugin must be registered with six steps:
    /// "Create" message for "<see cref="Account"/>" entity(on Post-operation) asynchronous 
    /// "Update" message for "<see cref="Account"/>" entity(on Post-operation) asynchronous
    /// "Create" message for "<see cref="ars_Technician"/>" entity(on Post-operation) asynchronous
    /// "Update" message for "<see cref="ars_Technician"/>" entity(on Post-operation) asynchronous
    /// </summary>
    public sealed class GeoLocationUpdaterPlugin : UnconstraintedPluginBase, IPlugin
    {
        private readonly IEntityGeoLocationConfig<XmlEntityGeoLocationSection, XmlEntityAttribute, XmlGeoLocation> _config;

        public GeoLocationUpdaterPlugin(string unsecureConfig, string secureConfig)
        {
            if (String.IsNullOrWhiteSpace(unsecureConfig))
            {
                throw new ArgumentException("Unsecure plugin configuration cannot be null or empty for this plugin. It must represent entity geo location section", "unsecureConfig");
            }

            var parser = new XmlConfigParser();
            _config = parser.Parse(unsecureConfig);
        }

        protected override void RegisterDependencies(IContainer container)
        {
            base.RegisterDependencies(container);

            container.Register<IServiceContextFactory, AttributeTrackingContextFactory>();
        }

        protected override void HandleRequest()
        {
            string bingMapsKey = Container.Resolve<ISettingsService>().GetSettingValueByName("Bing Maps Key");

            var optionSetHelper = new CachingOptionSetHelper(new OptionSetHelper(ArsOrganizationContext));

            IGeoLocationUpdater entityGeoLocationUpdater = new GeoLocationUpdater(
                ArsOrganizationContext,
                new EntityGeoLocationUpdater(
                    new BingMapsGeoLocator(bingMapsKey),
                    new CachingMetadataService(new MetadataService(ArsOrganizationContext)),
                    new EntityAttributeValueHandler(
                        ArsOrganizationContext,
                        optionSetHelper,
                        new StrictOptionSetValueParsingStrategy(optionSetHelper))));

            var entity = (Entity)Context.InputParameters["Target"];

            entityGeoLocationUpdater.UpdateGeoLocation(entity.ToEntityReference(), _config);
            ArsOrganizationContext.SaveChanges();
        }
    }
}
