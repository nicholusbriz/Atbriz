import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Report from '@/models/Report';
import { hasAdminApiAccess } from '@/lib/admin-api-auth';

export async function GET() {
  try {
    await connectDB();
    const reports = await Report.find()
      .select(
        'referenceCode title category description email attachments districtName subcountyName parishName villageName villageType status isDemo createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reports, total: reports.length });
  } catch (error) {
    console.error('[GET /api/admin/reports]', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!hasAdminApiAccess(req)) {
    return NextResponse.json({ error: 'Admin API key is missing or invalid' }, { status: 401 });
  }

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (typeof body.id !== 'string' || !Types.ObjectId.isValid(body.id)) {
    return NextResponse.json({ error: 'A valid report id is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const report = await Report.findByIdAndDelete(body.id).select('_id referenceCode').lean();
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json({ deleted: true, id: report._id });
  } catch (error) {
    console.error('[DELETE /api/admin/reports]', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
