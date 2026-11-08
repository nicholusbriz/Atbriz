import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Role from '@/models/Role';
import { requireUser, unauthorized } from '@/lib/auth-guard';
import { PERMISSION_IDS } from '@/lib/access-map';

/** GET /api/me/pages — role + permissions for the current user.
 *  Section access is hardcoded in lib/access-map.ts (SECTION_ACCESS). */
export async function GET() {
  const sessionUser = await requireUser();
  if (!sessionUser) return unauthorized();

  try {
    await connectDB();
    const user = await User.findById(sessionUser.id)
      .select('role districtName subcountyName parishName villageName villageType email')
      .lean();
    const roleDoc = user
      ? await Role.findById(user.role).select('name permissions').lean()
      : null;
    const roleName = roleDoc?.name ?? 'user';

    return NextResponse.json({
      role: roleName,
      // dev implicitly has every permission; others read it from the DB
      permissions: roleName === 'dev' ? [...PERMISSION_IDS] : (roleDoc?.permissions ?? []),
      email: user?.email ?? null,
      location: {
        district: user?.districtName ?? null,
        subcounty: user?.subcountyName ?? null,
        parish: user?.parishName ?? null,
        village: user?.villageName ?? null,
        villageType: user?.villageType ?? null,
      },
    });
  } catch (err) {
    console.error('[GET /api/me/pages]', err);
    return NextResponse.json({ error: 'Failed to load access' }, { status: 500 });
  }
}
