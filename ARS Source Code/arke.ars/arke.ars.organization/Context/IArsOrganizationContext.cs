using System.Linq;
using Arke.Crm.Utils;

namespace Arke.ARS.Organization.Context
{
    public interface IArsOrganizationContext : IOrganizationServiceContext
    {
        IQueryable<ars_arssetting> ars_arssettingSet { get; }

        IQueryable<ars_technician> ars_technicianSet { get; }

        IQueryable<ars_workordernote> ars_workordernoteSet { get; }

        IQueryable<ars_workitem> ars_workitemSet { get; }

        IQueryable<ars_technicianitem> ars_technicianitemSet { get; }

        IQueryable<Incident> IncidentSet { get; }

        IQueryable<SalesOrder> SalesOrderSet { get; }

        IQueryable<ServiceAppointment> ServiceAppointmentSet { get; }

        IQueryable<Account> AccountSet { get; }

        IQueryable<Contact> ContactSet { get; }

        IQueryable<UserSettings> UserSettingsSet { get; }

        IQueryable<Service> ServiceSet { get; }

        IQueryable<Annotation> AnnotationSet { get; }
        IQueryable<ars_region> ars_regionSet { get; }

        IQueryable<SalesOrderDetail> SalesOrderDetailSet { get; }

        IQueryable<ars_workorderevent> ars_workordereventSet { get; }
    }
}