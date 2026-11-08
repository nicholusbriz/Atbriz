/**
 * GET /api/admin/sync/status
 * Returns counts from your own collections only — no external API calls.
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import District from '@/models/District';
import Subcounty from '@/models/Subcounty';
import Parish from '@/models/Parish';
import Village from '@/models/Village';

export async function GET() {
  try {
    await connectDB();

    const [districts, subcounties, parishes, villages] = await Promise.all([
      District.countDocuments(),
      Subcounty.countDocuments(),
      Parish.countDocuments(),
      Village.countDocuments(),
    ]);

    // Latest update timestamp
    const latest = await Village.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean()
      ?? await Parish.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean()
      ?? await District.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();

    return NextResponse.json({
      ok: true,
      lastUpdated: latest ? (latest as { updatedAt?: Date }).updatedAt : null,
      counts: { districts, subcounties, parishes, villages },
      total: districts + subcounties + parishes + villages,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
