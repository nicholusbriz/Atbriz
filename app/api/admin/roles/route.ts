import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Role from '@/models/Role';
import { requireRouteAccess, unauthorized } from '@/lib/auth-guard';

/** GET /api/admin/roles — all roles with their allowed pages. */
export async function GET(request: Request) {
  const user = await requireRouteAccess(request);
  if (!user) return unauthorized('Pages manage permission required');

  try {
    await connectDB();
    const roles = await Role.find().select('name description permissions').sort({ name: 1 }).lean();
    return NextResponse.json({ roles });
  } catch (err) {
    console.error('[GET /api/admin/roles]', err);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
