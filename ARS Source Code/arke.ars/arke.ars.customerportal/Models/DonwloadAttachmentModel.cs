namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class DonwloadAttachmentModel
    {
        public string MimeType { get; set; }

        public byte[] Content { get; set; }

        public string FileName { get; set; }
    }
}