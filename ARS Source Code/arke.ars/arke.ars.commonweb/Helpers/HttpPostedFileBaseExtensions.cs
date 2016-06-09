using System;
using System.IO;
using System.Web;

namespace Arke.ARS.CommonWeb.Helpers
{
    public static class HttpPostedFileBaseExtensions
    {
        public static string GetNonEmptyFileName(this HttpPostedFileBase file)
        {
            return Path.GetFileName(file.FileName ?? Path.GetRandomFileName());
        }

        public static string ConvertToBase64(this HttpPostedFileBase file)
        {
            using (var reader = new BinaryReader(file.InputStream))
            {
                byte[] bytes = reader.ReadBytes(file.ContentLength);
                return Convert.ToBase64String(bytes);
            }
        }
    }
}