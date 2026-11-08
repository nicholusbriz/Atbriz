import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Role from '@/models/Role';
import { requireRouteAccess, unauthorized } from '@/lib/auth-guard';
import { PERMISSION_IDS } from '@/lib/access-map';

/**
 * PUT /api/admin/pages — set a role's permissions.
 * Section access is hardcoded in lib/access-map.ts (SECTION_ACCESS).
 * The 'dev' role is locked.
 */
export async function PUT(req: NextRequest) {
  const user = await requireRouteAccess(req);
  if (!user) return unauthorized('Pages manage permission required');

  let body: { role?: unknown; permissions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const roleName = typeof body.role === 'string' ? body.role.trim().toLowerCase() : '';
  const permissions = body.permissions === undefined
    ? undefined
    : Array.isArray(body.permissions)
      ? [...new Set(body.permissions.filter((p): p is string => typeof p === 'string'))]
      : null;

  if (!roleName) {
    return NextResponse.json({ error: 'A role name is required' }, { status: 400 });
  }
  // dev implicitly has every permission — not editable
  if (roleName === 'dev') {
    return NextResponse.json({ error: 'dev access cannot be modified' }, { status: 403 });
  }
  if (permissions === null || (permissions && permissions.some((p) => !PERMISSION_IDS.includes(p)))) {
    return NextResponse.json({ error: 'Permissions must be valid permission ids' }, { status: 400 });
  }
  if (!permissions) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    await connectDB();
    const role = await Role.findOneAndUpdate(
      { name: roleName },
      { $set: { permissions } },
      { returnDocument: 'after' },
    ).select('name permissions').lean();

    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    return NextResponse.json({ role });
  } catch (err) {
    console.error('[PUT /api/admin/pages]', err);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
