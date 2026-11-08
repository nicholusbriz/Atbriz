import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Setting from '@/models/Setting';
import { requireRouteAccess, unauthorized } from '@/lib/auth-guard';
import { bustSessionsCache } from '@/auth';
import { logActivity } from '@/lib/activity-log';

/**
 * POST /api/admin/auth/invalidate-all — force every user to re-login.
 * Sets sessionsValidAfter = now; any JWT issued before this moment is rejected.
 */
export async function POST(request: Request) {
  const user = await requireRouteAccess(request);
  if (!user) return unauthorized('Permission required');

  try {
    await connectDB();
    await Setting.findOneAndUpdate(
      { key: 'sessionsValidAfter' },
      { $set: { value: new Date() } },
      { upsert: true, returnDocument: 'after' },
    );
    bustSessionsCache();
    logActivity({ type: 'admin.invalidate_all', action: 'All user sessions invalidated', actorId: user.id, actorName: user.username, req: request });
    return NextResponse.json({ ok: true, invalidatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[POST /api/admin/auth/invalidate-all]', err);
    return NextResponse.json({ error: 'Failed to invalidate sessions' }, { status: 500 });
  }
}
