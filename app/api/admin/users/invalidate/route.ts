import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Role from '@/models/Role';
import { requireRouteAccess, unauthorized } from '@/lib/auth-guard';
import { logActivity } from '@/lib/activity-log';

/**
 * POST /api/admin/users/invalidate — force ONE user to re-login.
 * Sets roleChangedAt = now; their existing JWT is rejected on next request.
 * dev users cannot be invalidated.
 */
export async function POST(req: NextRequest) {
  const user = await requireRouteAccess(req);
  if (!user) return unauthorized('Permission required');

  let body: { email?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!email && !userId) {
    return NextResponse.json({ error: 'Provide an email or userId' }, { status: 400 });
  }

  try {
    await connectDB();
    const target = await User.findOne(email ? { email } : { _id: userId })
      .select('username email role')
      .lean();
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const role = await Role.findById(target.role).select('name').lean();
    if (role?.name === 'dev') {
      return NextResponse.json({ error: 'dev users cannot be signed out' }, { status: 403 });
    }

    await User.updateOne({ _id: target._id }, { $set: { roleChangedAt: new Date() } });
    logActivity({
      type: 'user.invalidate',
      action: `User "${target.username}" signed out`,
      actorId: user.id,
      actorName: user.username,
      details: { targetUserId: target._id.toString(), targetEmail: target.email },
      req,
    });
    return NextResponse.json({ ok: true, username: target.username, email: target.email });
  } catch (err) {
    console.error('[POST /api/admin/users/invalidate]', err);
    return NextResponse.json({ error: 'Failed to sign out user' }, { status: 500 });
  }
}
