using System;
using System.Security.Claims;
using Microsoft.AspNet.Identity;

namespace Arke.ARS.CommonWeb.Services
{
    public interface IAuthenticationService
    {
        IUser<Guid> FindUser(string name, string password);

        ClaimsIdentity CreateIdentity(IUser<Guid> user, string authenticationType); 
    }
}