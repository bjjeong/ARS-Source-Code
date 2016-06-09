using System;
using Arke.ARS.CustomerPortal.Models;

namespace Arke.ARS.CustomerPortal.Services
{
    public interface IAttachmentService
    {
        DonwloadAttachmentModel GetAttachment(Guid attachmentId);
    }
}