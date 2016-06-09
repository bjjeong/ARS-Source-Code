using System;
using Microsoft.AspNet.Identity;

namespace Arke.ARS.CommonWeb.Services.Impl
{
    public sealed class SimpleUser : IUser<Guid>
    {
        public Guid Id { get; set; }

        public string UserName { get; set; }
    }
}