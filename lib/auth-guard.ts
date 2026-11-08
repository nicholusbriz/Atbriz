/**
 * Backend auth verification — the single file API routes use to check
 * who is calling. The session JWT is verified by Auth.js on every call.
 *
 * Usage in a route handler:
 *   const user = await requireUser();
 *   if (!user) return unauthorized();
 *
 *   const admin = await requireAdmin();
 *   if (!admin) return unauthorized('Admin access required');
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Role from '@/models/Role';
import { getSessionUser, type SessionUser } from '@/auth';
import { ROUTE_PERMISSIONS } from '@/lib/access-map';

export { getSessionUser };
export type { SessionUser };

/** Any signed-in user (role 'user' or 'admin'). */
export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Permission check — resolves the user's role permissions from the DB
 * on every call (so access changes apply immediately).
 * 'dev' implicitly has every permission.
 */
export async function requirePermission(permission: string): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role === 'dev') return user;

  try {
    await connectDB();
    const dbUser = await User.findById(user.id).select('role').lean();
    const role = dbUser
      ? await Role.findById(dbUser.role).select('permissions').lean()
      : null;
    return role?.permissions?.includes(permission) ? user : null;
  } catch {
    return null;
  }
}

/**
 * Route-level guard — looks up "METHOD /path" in ROUTE_PERMISSIONS
 * (lib/access-map.ts) and enforces that permission. Unmapped routes deny.
 */
export async function requireRouteAccess(request: Request): Promise<SessionUser | null> {
  const { pathname } = new URL(request.url);
  const permission = ROUTE_PERMISSIONS[`${request.method} ${pathname}`];
  if (!permission) return null;
  return requirePermission(permission);
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}
