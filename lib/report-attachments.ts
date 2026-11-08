export const MAX_REPORT_ATTACHMENTS = 3;
export const MAX_REPORT_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_REPORT_VIDEO_DURATION_SECONDS = 3 * 60;

export type ReportAttachmentResourceType = 'image' | 'video';

export interface ReportAttachment {
  publicId: string;
  resourceType: ReportAttachmentResourceType;
  secureUrl: string;
  format: string;
  bytes: number;
}
