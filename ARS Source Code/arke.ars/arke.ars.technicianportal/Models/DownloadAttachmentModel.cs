namespace Arke.ARS.TechnicianPortal.Models
{
    public sealed class DownloadAttachmentModel
    {
        public string MimeType { get; set; }

        public byte[] Content { get; set; }

        public string FileName { get; set; }
    }
}