using System;
using System.ComponentModel;
using System.Linq;
using Arke.ARS.TechnicianPortal.Models;

namespace Arke.ARS.TechnicianPortal.Infrastructure
{
    public static class EnumUtility
    {
        public static string GetDescription(this StatusCode statusCode)
        {
            return GetDescriptionFromEnumValue(statusCode);
        }

        public static string GetDescription(this EventType eventType)
        {
            return GetDescriptionFromEnumValue(eventType);
        }

        public static string GetDescriptionFromEnumValue(Enum value)
        {
            var attribute = value.GetType()
                .GetField(value.ToString())
                .GetCustomAttributes(typeof(DescriptionAttribute), false)
                .SingleOrDefault() as DescriptionAttribute;
            return attribute == null ? value.ToString() : attribute.Description;
        }

        public static T GetEnumValueFromDescription<T>(string description)
        {
            var type = typeof(T);
            if (!type.IsEnum)
                throw new ArgumentException();
            var fields = type.GetFields();
            var field = fields
                .SelectMany(f => f.GetCustomAttributes(
                    typeof(DescriptionAttribute), false), (
                        f, a) => new { Field = f, Att = a }).SingleOrDefault(a => ((DescriptionAttribute)a.Att)
                            .Description == description);
            return field == null ? default(T) : (T)field.Field.GetRawConstantValue();
        }
    }
}