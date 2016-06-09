using System;

namespace Arke.ARS.CustomerPortal.Services
{
    public interface ICustomerService
    {
        string GetCustomerName(Guid customerId); 
    }
}