import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createBlobUploadUrl } from '@/lib/azure-blob-storage';
import {
  MAX_REPORT_IMAGE_BYTES,
  type ReportAttachmentResourceType,
} from '@/lib/report-attachments';

function isResourceType(value: unknown): value is ReportAttachmentResourceType {
  return value === 'image' || value === 'video';
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin || origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'Upload requests must come from this site' }, { status: 403 });
  }

  let body: { contentType?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const contentType = typeof body.contentType === 'string' ? body.contentType : '';
  const resourceType = contentType.startsWith('image/')
    ? 'image'
    : contentType.startsWith('video/')
      ? 'video'
      : null;
  if (!resourceType || !isResourceType(resourceType)) {
    return NextResponse.json({ error: 'Only image and video uploads are supported' }, { status: 400 });
  }
  if (typeof body.size !== 'number' || !Number.isSafeInteger(body.size) || body.size < 1) {
    return NextResponse.json({ error: 'A valid file size is required' }, { status: 400 });
  }
  if (resourceType === 'image' && body.size > MAX_REPORT_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Images must be 10 MB or smaller' }, { status: 400 });
  }

  try {
    const blobName = `report_attachments/${randomUUID()}`;
    const upload = await createBlobUploadUrl(blobName, contentType);
    return NextResponse.json({ ...upload, resourceType });
  } catch (error) {
    console.error('[POST /api/uploads/azure-sas]', error);
    return NextResponse.json({ error: 'Could not prepare the Azure upload' }, { status: 503 });
  }
}
