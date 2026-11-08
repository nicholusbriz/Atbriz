import { connectDB } from '@/lib/mongoose';
import LoginThrottle from '@/models/LoginThrottle';

const MAX_FAILS = 10;
const BLOCK_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function getBlockStatus(key: string): Promise<{ blocked: boolean; retryAt?: Date; remaining: number }> {
  await connectDB();
  const doc = await LoginThrottle.findOne({ key }).lean();
  if (!doc) return { blocked: false, remaining: MAX_FAILS };

  const blocked = !!doc.blockedUntil && doc.blockedUntil.getTime() > Date.now();
  return {
    blocked,
    retryAt: blocked ? doc.blockedUntil : undefined,
    remaining: Math.max(0, MAX_FAILS - doc.fails),
  };
}

export async function recordFail(key: string): Promise<void> {
  await connectDB();
  const doc = await LoginThrottle.findOneAndUpdate(
    { key },
    {
      $inc: { fails: 1 },
      $set: { blockedUntil: undefined },
    },
    { upsert: true, returnDocument: 'after' },
  ).lean();

  // set blockedUntil only when threshold is crossed
  if (doc && doc.fails >= MAX_FAILS && (!doc.blockedUntil || doc.blockedUntil.getTime() <= Date.now())) {
    await LoginThrottle.updateOne(
      { key },
      { $set: { blockedUntil: new Date(Date.now() + BLOCK_MS) } },
    );
  }
}

export async function clearFails(key: string): Promise<void> {
  await connectDB();
  await LoginThrottle.deleteOne({ key });
}
