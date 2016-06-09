using System;
using System.Linq;
using Arke.ARS.Organization.Context;
using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Plugins
{
    /// <summary>
    /// Plugin that updates Account Number.
    /// Plugin must be registered with two steps:
    /// "Create" message for <see cref="Account"/> entity(on Pre-operation)
    /// "Update" message for <see cref="Account"/> entity(on Pre-operation)
    /// </summary>
    public sealed class AccountNumberGeneratorPlugin : PluginBase<Account>, IPlugin
    {
        protected override void HandleRequest()
        {
            var accountNumber = Target.AccountNumber;

            if (string.IsNullOrWhiteSpace(accountNumber))
            {
                AddAccountNumber();
            }
            else
            {
                ValidateAccountNumber();
            }
        }

        private void AddAccountNumber()
        {
            var accounts = ArsOrganizationContext
                .AccountSet
                .ToList();

            var maxNumber = 1;
            foreach (var account in accounts)
            {
                int j;
                if (int.TryParse(account.AccountNumber, out j))
                {
                    if (maxNumber < j)
                    {
                        maxNumber = j;
                    }
                }
            }

            Target.AccountNumber = (maxNumber + 1).ToString();
            ArsOrganizationContext.SaveChanges();
        }

        private void ValidateAccountNumber()
        {
            int j;
            if (!int.TryParse(Target.AccountNumber, out j))
            {
                throw new ArgumentException(string.Format("Account Number {0} could not be created. If you leave the Account Number field blank a new unique number will be generated automatically", Target.AccountNumber));
            }

            var sameNumbers = ArsOrganizationContext
                .AccountSet
                .Where(a => a.AccountNumber == Target.AccountNumber).ToList();

            if (sameNumbers.Count > 0)
            {
                throw new ArgumentException(
                    string.Format("Account Number {0} is already in use: {1}. If you leave the Account Number field blank a new unique number will be generated automatically",
                        Target.AccountNumber, sameNumbers.First().Name));
            }
        }
    }
}
