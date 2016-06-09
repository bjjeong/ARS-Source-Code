using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security;
[assembly: AllowPartiallyTrustedCallers]
namespace Arke.ARS.Activities
{
    using System.Activities;
    using System.Web.Security;
    using Microsoft.Xrm.Sdk;
    using Microsoft.Xrm.Sdk.Workflow;

    public sealed class GeneratePassword : CodeActivity
    {
        
        protected override void Execute(CodeActivityContext executionContext)
        {
            int length = Length.Get<int>(executionContext);
            if (length > 128 || length < 1)
            {
                throw new InvalidPluginExecutionException("The length must be between 1 and 128 characters.");
            }

            int numberOfNonAlphanumericCharacters = NumberOfNonAlphanumericCharacters.Get<int>(executionContext);
            if (numberOfNonAlphanumericCharacters > length || numberOfNonAlphanumericCharacters < 0)
            {
                throw new InvalidPluginExecutionException("The number of non-alphanumeric characters must be greater or equals 0 and less or equals total password length.");
            }

            string allowedChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";
            string allowedNonAlphaChars = "!@$?_-";
            char[] chars = new char[length];
            Random rd = new Random();

            for (int i = 0; i < length; i++)
            {
                chars[i] = allowedChars[rd.Next(0, allowedChars.Length)];
            }

            for (int i = 0; i < numberOfNonAlphanumericCharacters; i++)
            {
                chars[rd.Next(0, length)] = allowedNonAlphaChars[rd.Next(0, allowedNonAlphaChars.Length)];
            }


            //string result = new string(chars);

            string result = Membership.GeneratePassword(length, numberOfNonAlphanumericCharacters);
           // string result = "12345678";

            Result.Set(executionContext, result);
        }

        [Output("Result")]
        public OutArgument<string> Result { get; set; }

        [Input("The number of characters in the generated password. The length must be between 1 and 128 characters.")]
        [Default("8")]
        public InArgument<int> Length { get; set; }

        [Input("The minimum number of punctuation characters in the generated password.")]
        [Default("2")]
        public InArgument<int> NumberOfNonAlphanumericCharacters { get; set; }
    }
}