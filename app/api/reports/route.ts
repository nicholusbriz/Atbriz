import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { getBlobContainerClient } from '@/lib/azure-blob-storage';
import District from '@/models/District';
import Subcounty from '@/models/Subcounty';
import Parish from '@/models/Parish';
import Village from '@/models/Village';
import Report, { REPORT_CATEGORIES } from '@/models/Report';
import {
  MAX_REPORT_ATTACHMENTS,
  MAX_REPORT_IMAGE_BYTES,
  type ReportAttachment,
  type ReportAttachmentResourceType,
} from '@/lib/report-attachments';

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && Types.ObjectId.isValid(value);
}

function isReportCategory(value: unknown): value is typeof REPORT_CATEGORIES[number] {
  return typeof value === 'string' && REPORT_CATEGORIES.includes(value as typeof REPORT_CATEGORIES[number]);
}

function isReportAttachmentInput(value: unknown): value is {
  publicId: string;
  resourceType: ReportAttachmentResourceType;
} {
  if (!value || typeof value !== 'object') return false;
  const attachment = value as { publicId?: unknown; resourceType?: unknown };
  return typeof attachment.publicId === 'string'
    && /^report_attachments\/[0-9a-f-]{36}$/i.test(attachment.publicId)
    && (attachment.resourceType === 'image' || attachment.resourceType === 'video');
}

class AttachmentValidationError extends Error {}

export async function GET() {
  try {
    await connectDB();
    const reports = await Report.find({
      status: { $ne: 'rejected' },
      isDemo: { $ne: true },
    })
      .select('_id referenceCode title category description attachments districtName subcountyName parishName villageName villageType status createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(
      { reports, total: reports.length },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[GET /api/reports]', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: {
    title?: unknown;
    category?: unknown;
    description?: unknown;
    email?: unknown;
    districtId?: unknown;
    subcountyId?: unknown;
    parishId?: unknown;
    villageId?: unknown;
    attachments?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!isReportCategory(body.category)) {
    return NextResponse.json({ error: 'Choose a valid report category' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 120) {
    return NextResponse.json({ error: 'Title must be between 1 and 120 characters' }, { status: 400 });
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description || description.length > 5000) {
    return NextResponse.json({ error: 'Description must be between 1 and 5000 characters' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }

  if (!isObjectId(body.districtId)) {
    return NextResponse.json({ error: 'A valid district is required' }, { status: 400 });
  }
  if (body.subcountyId !== undefined && !isObjectId(body.subcountyId)) {
    return NextResponse.json({ error: 'Invalid subcounty' }, { status: 400 });
  }
  if (body.parishId !== undefined && !isObjectId(body.parishId)) {
    return NextResponse.json({ error: 'Invalid parish' }, { status: 400 });
  }
  if (body.villageId !== undefined && !isObjectId(body.villageId)) {
    return NextResponse.json({ error: 'Invalid village or cell' }, { status: 400 });
  }

  if ((body.parishId && !body.subcountyId) || (body.villageId && !body.parishId)) {
    return NextResponse.json({ error: 'Location selections must follow the district, subcounty, parish, village hierarchy' }, { status: 400 });
  }

  const attachmentInputs = body.attachments ?? [];
  if (!Array.isArray(attachmentInputs)
    || attachmentInputs.length > MAX_REPORT_ATTACHMENTS
    || !attachmentInputs.every(isReportAttachmentInput)
  ) {
    return NextResponse.json({ error: `Attach up to ${MAX_REPORT_ATTACHMENTS} valid images or videos` }, { status: 400 });
  }
  const attachmentIds = attachmentInputs.map((attachment) => attachment.publicId);
  if (new Set(attachmentIds).size !== attachmentIds.length) {
    return NextResponse.json({ error: 'Duplicate attachments are not allowed' }, { status: 400 });
  }

  try {
    let attachments: ReportAttachment[] = [];
    if (attachmentInputs.length > 0) {
      try {
        const containerClient = getBlobContainerClient();
        attachments = await Promise.all(attachmentInputs.map(async (input) => {
          const blobClient = containerClient.getBlobClient(input.publicId);
          const properties = await blobClient.getProperties();
          const contentType = properties.contentType ?? '';
          const bytes = properties.contentLength ?? 0;
          let validationError = '';
          if (!contentType.startsWith(`${input.resourceType}/`)) validationError = 'The uploaded file type did not match';
          else if (bytes < 1) validationError = 'The uploaded file is empty';
          else if (input.resourceType === 'image' && bytes > MAX_REPORT_IMAGE_BYTES) {
            validationError = 'The image exceeds the 10 MB limit';
          }
          if (validationError) throw new AttachmentValidationError(validationError);

          return {
            publicId: input.publicId,
            resourceType: input.resourceType,
            secureUrl: blobClient.url,
            format: contentType,
            bytes,
          };
        }));
      } catch (error) {
        console.error('[POST /api/reports] Azure Blob attachment verification failed:', error);
        if (error instanceof AttachmentValidationError) {
          return NextResponse.json({ error: `${error.message}. Please check the attachment and try again.` }, { status: 400 });
        }
        return NextResponse.json({
          error: 'Could not verify an attachment with Azure. Please try uploading it again.',
        }, { status: 502 });
      }
    }

    await connectDB();

    const district = await District.findById(body.districtId).select('_id name').lean();
    if (!district) return NextResponse.json({ error: 'Selected district was not found' }, { status: 400 });

    const reportLocation: {
      districtId: Types.ObjectId;
      districtName: string;
      subcountyId?: Types.ObjectId;
      subcountyName?: string;
      parishId?: Types.ObjectId;
      parishName?: string;
      villageId?: Types.ObjectId;
      villageName?: string;
      villageType?: 'village' | 'cell';
    } = { districtId: district._id, districtName: district.name };

    let subcounty: { _id: Types.ObjectId; name: string } | null = null;
    if (body.subcountyId) {
      subcounty = await Subcounty.findOne({ _id: body.subcountyId, districtId: district._id })
        .select('_id name')
        .lean();
      if (!subcounty) return NextResponse.json({ error: 'Selected subcounty does not belong to this district' }, { status: 400 });
      reportLocation.subcountyId = subcounty._id;
      reportLocation.subcountyName = subcounty.name;
    }

    let parish: { _id: Types.ObjectId; name: string } | null = null;
    if (body.parishId && subcounty) {
      parish = await Parish.findOne({ _id: body.parishId, subcountyId: subcounty._id })
        .select('_id name')
        .lean();
      if (!parish) return NextResponse.json({ error: 'Selected parish does not belong to this subcounty' }, { status: 400 });
      reportLocation.parishId = parish._id;
      reportLocation.parishName = parish.name;
    }

    if (body.villageId && parish) {
      const village = await Village.findOne({ _id: body.villageId, parishId: parish._id })
        .select('_id name type')
        .lean();
      if (!village) return NextResponse.json({ error: 'Selected village or cell does not belong to this parish' }, { status: 400 });
      reportLocation.villageId = village._id;
      reportLocation.villageName = village.name;
      reportLocation.villageType = village.type;
    }

    const report = await Report.create({
      referenceCode: `VUG-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`,
      title,
      category: body.category,
      description,
      ...(email ? { email } : {}),
      attachments,
      ...reportLocation,
    });

    return NextResponse.json({
      id: report._id,
      title: report.title,
      referenceCode: report.referenceCode,
      status: report.status,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reports]', error);
    return NextResponse.json({ error: 'Failed to save report. Please try again.' }, { status: 500 });
  }
}
