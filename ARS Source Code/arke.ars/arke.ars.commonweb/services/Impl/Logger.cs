using System;
using System.Text;
using System.Web;
using log4net;

namespace Arke.ARS.CommonWeb.Services.Impl
{
    public sealed class Logger : ILogger
    {
        private readonly ILog _log = LogManager.GetLogger("FileLogger");

        public void LogInfo(string format, params object[] args)
        {
            _log.InfoFormat(format, args);
        }

        public void LogWarning(string format, params object[] args)
        {
            _log.WarnFormat(format, args);
        }

        public void LogException(string message, Exception ex)
        {
            var exceptionInfo = new StringBuilder();
            exceptionInfo.AppendLine("==========================  Exception info see below  ===============================");
            exceptionInfo.AppendLine(message);

            if (HttpContext.Current != null)
            {
                HttpRequest request = HttpContext.Current.Request;
                exceptionInfo.AppendLine(String.Format((string) "Url: {0}", (object) request.RawUrl));
            }

            exceptionInfo.AppendLine(GetExceptionInfo(ex));

            _log.Error(exceptionInfo.ToString());
        }

        private string GetExceptionInfo(Exception ex)
        {
            var info = new StringBuilder();
            Exception currentException = ex;
            while (currentException != null)
            {
                info.AppendFormat("{0} - {1}", currentException.GetType(), currentException.Message);
                info.AppendLine();
                info.AppendLine(currentException.StackTrace);
                currentException = currentException.InnerException;
            }

            return info.ToString();
        }
    }
}