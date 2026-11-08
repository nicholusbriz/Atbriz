import { NextRequest, NextResponse } from 'next/server';
import { getBlockStatus } from '@/lib/login-throttle';

/** GET /api/auth/login-status?identifier=... — is this login blocked? */
export async function GET(req: NextRequest) {
  const identifier = req.nextUrl.searchParams.get('identifier')?.trim().toLowerCase() ?? '';
  if (!identifier) return NextResponse.json({ blocked: false, remaining: 10 });
  const status = await getBlockStatus(identifier);
  return NextResponse.json({
    blocked: status.blocked,
    retryAt: status.retryAt?.toISOString(),
    remaining: status.remaining,
  });
}
