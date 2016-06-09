using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Arke.ARS.CommonWeb.Services;
using Microsoft.AspNet.Identity;
using Microsoft.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;

namespace Arke.ARS.CommonWeb.Providers
{
    public sealed class ApplicationOAuthProvider : OAuthAuthorizationServerProvider
    {
        private readonly string _publicClientId;
        private readonly IAuthenticationService _authenticationService;

        public ApplicationOAuthProvider(string publicClientId, IAuthenticationService authenticationService)
        {
            if (publicClientId == null)
            {
                throw new ArgumentNullException("publicClientId");
            }

            if (authenticationService == null)
            {
                throw new ArgumentNullException("authenticationService");
            }

            _publicClientId = publicClientId;
            _authenticationService = authenticationService;
        }

        public async override Task GrantResourceOwnerCredentials(OAuthGrantResourceOwnerCredentialsContext context)
        {
            if (String.IsNullOrWhiteSpace(context.UserName))
            {
                context.SetError("server_error", "The user name cannot be null or empty.");
                return;
            }

            if (context.Password == null)
            {
                context.SetError("server_error", "The passowrd cannot be null.");
                return;
            }

            IUser<Guid> user = _authenticationService.FindUser(context.UserName, context.Password);
            if (user == null)
            {
                context.SetError("invalid_grant", "The user name or password is incorrect.");
            }
            else
            {
                ClaimsIdentity oAuthIdentity = _authenticationService.CreateIdentity(user, context.Options.AuthenticationType);
                ClaimsIdentity cookiesIdentity = _authenticationService.CreateIdentity(user, CookieAuthenticationDefaults.AuthenticationType);
                AuthenticationProperties properties = CreateProperties(user.UserName, await context.Request.ReadFormAsync());

                var ticket = new AuthenticationTicket(oAuthIdentity, properties);
                context.Validated(ticket);
                context.Request.Context.Authentication.SignIn(cookiesIdentity);
            }
        }

        public override Task TokenEndpoint(OAuthTokenEndpointContext context)
        {
            foreach (KeyValuePair<string, string> property in context.Properties.Dictionary)
            {
                context.AdditionalResponseParameters.Add(property.Key, property.Value);
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientAuthentication(OAuthValidateClientAuthenticationContext context)
        {
            // Resource owner password credentials does not provide a client ID.
            if (context.ClientId == null)
            {
                context.Validated();
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientRedirectUri(OAuthValidateClientRedirectUriContext context)
        {
            if (context.ClientId == _publicClientId)
            {
                var expectedRootUri = new Uri(context.Request.Uri, "/");

                if (expectedRootUri.AbsoluteUri == context.RedirectUri)
                {
                    context.Validated();
                }
            }

            return Task.FromResult<object>(null);
        }

        public static AuthenticationProperties CreateProperties(string userName, IFormCollection form)
        {
            IDictionary<string, string> data = new Dictionary<string, string>
            {
                { "userName", userName }
            };

            var props = new AuthenticationProperties(data);

            bool remember;
            if (Boolean.TryParse(form["remember"], out remember))
            {
                props.IsPersistent = remember;
            }

            return props;
        }        
    }
}