using System;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http.ExceptionHandling;

namespace Arke.ARS.CommonWeb.Services.Impl
{
    public sealed class WebApiExceptionLogger : ExceptionLogger
    {
        private readonly ILogger _logger;

        public WebApiExceptionLogger(ILogger logger)
        {
            if (logger == null)
            {
                throw new ArgumentNullException("logger");
            }

            _logger = logger;
        }

        public async override Task LogAsync(ExceptionLoggerContext context, CancellationToken cancellationToken)
        {
            _logger.LogException("An unhandled exception occurred.", context.Exception);
            await base.LogAsync(context, cancellationToken);
        }

        public override void Log(ExceptionLoggerContext context)
        {
            _logger.LogException("An unhandled exception occurred.", context.Exception);
            base.Log(context);
        }
    }
}