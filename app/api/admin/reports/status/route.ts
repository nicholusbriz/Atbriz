import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { requireRouteAccess } from '@/lib/auth-guard';
import Report, { type ReportStatus } from '@/models/Report';

const reportStatuses: ReportStatus[] = ['pending', 'under_review', 'resolved', 'rejected'];

export async function PATCH(request: Request) {
  const user = await requireRouteAccess(request);
  if (!user) {
    return NextResponse.json({ error: 'Reports manage permission required' }, { status: 401 });
  }

  let body: { id?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (typeof body.id !== 'string' || !Types.ObjectId.isValid(body.id)) {
    return NextResponse.json({ error: 'A valid report id is required' }, { status: 400 });
  }
  if (typeof body.status !== 'string' || !reportStatuses.includes(body.status as ReportStatus)) {
    return NextResponse.json({ error: 'Choose a valid report status' }, { status: 400 });
  }

  try {
    await connectDB();
    const report = await Report.findByIdAndUpdate(
      body.id,
      { $set: { status: body.status } },
      { returnDocument: 'after', runValidators: true },
    )
      .select('_id status updatedAt')
      .lean();

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ report });
  } catch (error) {
    console.error('[PATCH /api/admin/reports/status]', error);
    return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
  }
}
