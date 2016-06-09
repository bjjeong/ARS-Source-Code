using System;
using System.Web.Mvc;
using Arke.ARS.CustomerPortal.Models;
using Arke.ARS.CustomerPortal.Services;

namespace Arke.ARS.CustomerPortal.Controllers
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

        public ActionResult Donwload(Guid id)
        {
            DonwloadAttachmentModel attachment = _attachmentService.GetAttachment(id);
            if (attachment == null)
            {
                return HttpNotFound();
            }

            return File(attachment.Content, attachment.MimeType, attachment.FileName);
        }
    }
}