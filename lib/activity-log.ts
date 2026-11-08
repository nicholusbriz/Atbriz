import type { NextRequest } from 'next/server';
import type { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import ActivityLog from '@/models/ActivityLog';

export interface LogEntry {
  type: string;
  action: string;
  actorId?: string | Types.ObjectId;
  actorName?: string;
  details?: Record<string, unknown>;
  req?: NextRequest | Request | null;
}

function extractIp(req?: NextRequest | Request | null): string | undefined {
  if (!req) return undefined;
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? undefined;
}

/**
 * Fire-and-forget activity logger — safe to call anywhere (routes, auth).
 * Never throws; failures are swallowed so logging can't break requests.
 */
export function logActivity(entry: LogEntry): void {
  connectDB()
    .then(() =>
      ActivityLog.create({
        type: entry.type,
        action: entry.action,
        actorId: entry.actorId,
        actorName: entry.actorName,
        details: entry.details,
        ip: extractIp(entry.req),
        userAgent: entry.req?.headers.get('user-agent')?.slice(0, 300),
      }),
    )
    .catch((err) => console.error('[logActivity]', err));
}
