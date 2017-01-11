using System;
using Arke.ARS.TechnicianPortal.Models;

namespace Arke.ARS.TechnicianPortal.Services
{
    public interface IAttachmentService
    {
        DownloadAttachmentModel GetAttachment(Guid attachmentId);
    }
}