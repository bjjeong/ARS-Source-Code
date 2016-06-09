using System;
using System.Linq;
using Arke.ARS.TechnicianPortal.Controllers;
using NUnit.Framework;

namespace Arke.ARS.TechnicianPortal.Tests
{
    public class AssemblyTests
    {
        [TestCase("Arke.ARS.Plugins")]
        [TestCase("Arke.CRM.GeoLocation")]
        public void TestNotAllowedAssemblies(string unwanted)
        {
            Type representative = typeof(HomeController);
            var references = representative.Assembly.GetReferencedAssemblies();
            Assert.False(references.Any(a => a.Name == unwanted), string.Format("{0} should not be referenced", unwanted));
        }
    }
}
