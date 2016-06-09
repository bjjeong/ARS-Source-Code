using System;
using System.Linq;

namespace Arke.ARS.DevConsole
{
    public static class RandomExtensions
    {
        public static string GetRandomAlpahnumeric(this Random random, int length = 10)
        {
            var result = new string(
                Enumerable.Repeat("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", length)
                          .Select(s => s[random.Next(s.Length)])
                          .ToArray());

            return result;
        }
    }
}