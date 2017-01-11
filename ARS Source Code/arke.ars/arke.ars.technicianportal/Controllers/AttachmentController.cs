using System;
using System.Web.Mvc;
using Arke.ARS.TechnicianPortal.Models;
using Arke.ARS.TechnicianPortal.Services;

namespace Arke.ARS.TechnicianPortal.Controllers
{
    public sealed class AttachmentController : Controller
    {
        private readonly IAttachmentService _attachmentService;

        public AttachmentController(IAttachmentService attachmentService)
        {
            if (attachmentService == null)
            {
                throw new ArgumentNullException("attachmentService");
            }

            _attachmentService = attachmentService;
        }

        public ActionResult Download(Guid id)
        {
            DownloadAttachmentModel attachment = _attachmentService.GetAttachment(id);
            if (attachment == null)
            {
                return HttpNotFound();
            }

            return File(attachment.Content, attachment.MimeType, attachment.FileName);
        }
    }
}