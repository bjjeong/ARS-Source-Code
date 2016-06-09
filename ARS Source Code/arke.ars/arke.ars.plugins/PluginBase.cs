using System;
using Microsoft.Xrm.Sdk;

namespace Arke.ARS.Plugins
{
    public abstract class PluginBase<T> : UnconstraintedPluginBase where T : Entity
    {
        private const string TargetParameterName = "Target";

        protected T Target { get; private set; }

        protected override void EnvironmentInitialized()
        {
            if (Context.InputParameters.Contains(TargetParameterName) && Context.InputParameters[TargetParameterName] is Entity)
            {
                try
                {
                    Target = ((Entity)Context.InputParameters[TargetParameterName]).ToEntity<T>();
                }
                catch (NotSupportedException ex)
                {
                    throw new Exception(
                        String.Format(
                            "{0} has unexpected logical type. Expected type: {1}",
                            TargetParameterName,
                            typeof(T).Name), ex);
                }

                if (Target == null)
                {
                    throw new Exception(String.Format("{0} is null.", TargetParameterName));
                }
            }
            else
            {
                throw new Exception(String.Format("Cannot find '{0}' input context parameter.", TargetParameterName));
            }
        }
    }
}