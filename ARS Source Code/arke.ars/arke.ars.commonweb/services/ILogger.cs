using System;

namespace Arke.ARS.CommonWeb.Services
{
    public interface ILogger
    {
        void LogException(string message, Exception ex);

        void LogInfo(string format, params object[] args);

        void LogWarning(string format, params object[] args);
    }
}