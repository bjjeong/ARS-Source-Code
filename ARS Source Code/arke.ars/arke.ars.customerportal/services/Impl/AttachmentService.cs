using System;
using System.Linq;
using Arke.ARS.CustomerPortal.Models;
using Arke.ARS.Organization.Context;

namespace Arke.ARS.CustomerPortal.Services.Impl
{
    public sealed class AttachmentService : IAttachmentService
    {
        private readonly IArsOrganizationContext _context;

        public AttachmentService(IArsOrganizationContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            _context = context;
        }

        public DonwloadAttachmentModel GetAttachment(Guid attachmentId)
        {
            var attachment = _context.AnnotationSet.Where(a => a.Id == attachmentId).Select(a => new {
                a.DocumentBody,
                a.FileName,
                a.MimeType
            }).FirstOrDefault();

            if (attachment == null)
            {
                return null;
            }

            return new DonwloadAttachmentModel
            {
                Content = Convert.FromBase64String(attachment.DocumentBody),
                FileName = attachment.FileName,
                MimeType = attachment.MimeType
            };
        }
    }
}