import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import ActivityLog from '@/models/ActivityLog';
import { requireRouteAccess, unauthorized } from '@/lib/auth-guard';

/** GET /api/admin/logs — activity logs, filterable by ?type=&limit= */
export async function GET(request: NextRequest) {
  const user = await requireRouteAccess(request);
  if (!user) return unauthorized('Permission required');

  try {
    await connectDB();
    const typeParam = request.nextUrl.searchParams.get('type');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '100', 10) || 100, 500);

    // ?type=a,b supports multiple types
    const typeFilter = typeParam ? typeParam.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const filter = typeFilter.length ? { type: { $in: typeFilter } } : {};
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('type action actorName details ip userAgent createdAt')
      .lean();

    const typeList = await ActivityLog.distinct('type');
    const counts = await ActivityLog.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const typeCounts = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    return NextResponse.json({ logs, types: typeList, typeCounts });
  } catch (err) {
    console.error('[GET /api/admin/logs]', err);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}

/** DELETE /api/admin/logs?type=a,b — delete logs matching the filter (or all if none). */
export async function DELETE(request: NextRequest) {
  const user = await requireRouteAccess(request);
  if (!user) return unauthorized('Permission required');

  try {
    await connectDB();
    const typeParam = request.nextUrl.searchParams.get('type');
    const typeFilter = typeParam ? typeParam.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const filter = typeFilter.length ? { type: { $in: typeFilter } } : {};

    const result = await ActivityLog.deleteMany(filter);
    return NextResponse.json({ ok: true, deleted: result.deletedCount ?? 0 });
  } catch (err) {
    console.error('[DELETE /api/admin/logs]', err);
    return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 });
  }
}
