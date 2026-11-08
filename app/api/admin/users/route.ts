import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Role from '@/models/Role';
import { requireRouteAccess, unauthorized } from '@/lib/auth-guard';
import { logActivity } from '@/lib/activity-log';

/** GET /api/admin/users — list all users with their role names (users.manage). */
export async function GET(request: Request) {
  const user = await requireRouteAccess(request);
  if (!user) return unauthorized('Users manage permission required');

  try {
    await connectDB();
    const users = await User.find()
      .select('username email role emailVerified districtName subcountyName parishName villageName createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const roles = await Role.find().select('name').lean();
    const roleNameById = new Map(roles.map((r) => [r._id.toString(), r.name]));

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        emailVerified: u.emailVerified,
        role: roleNameById.get(u.role.toString()) ?? 'user',
        location: [u.districtName, u.subcountyName, u.parishName, u.villageName].filter(Boolean).join(', ') || null,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/** PATCH /api/admin/users — change a user's role (users.manage). Forces re-login via roleChangedAt. */
export async function PATCH(req: NextRequest) {
  const user = await requireRouteAccess(req);
  if (!user) return unauthorized('Users manage permission required');

  let body: { userId?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  const roleName = typeof body.role === 'string' ? body.role.trim().toLowerCase() : '';

  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'A valid userId is required' }, { status: 400 });
  }
  if (!roleName) {
    return NextResponse.json({ error: 'A role name is required' }, { status: 400 });
  }

  try {
    await connectDB();

    const role = await Role.findOne({ name: roleName }).select('_id name').lean();
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const target = await User.findById(userId).select('username role').lean();
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Can't change your own role from here
    if (target._id.toString() === user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    // dev role is locked — its users can't be demoted
    const targetRole = await Role.findById(target.role).select('name').lean();
    if (targetRole?.name === 'dev') {
      return NextResponse.json({ error: 'dev role cannot be changed' }, { status: 403 });
    }

    await User.updateOne(
      { _id: userId },
      { $set: { role: role._id, roleChangedAt: new Date() } },
    );

    logActivity({
      type: 'user.role_change',
      action: `Role of "${target.username}" changed to ${role.name}`,
      actorId: user.id,
      actorName: user.username,
      details: { targetUserId: userId, targetUsername: target.username, newRole: role.name },
      req,
    });

    return NextResponse.json({ ok: true, userId, role: role.name });
  } catch (err) {
    console.error('[PATCH /api/admin/users]', err);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
