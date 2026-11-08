import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity-log';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Role from '@/models/Role';
import District from '@/models/District';
import Subcounty from '@/models/Subcounty';
import Parish from '@/models/Parish';
import Village from '@/models/Village';

const USERNAME_RE = /^[\s\S]{3,50}$/; // any text, 3–50 chars
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

async function getOrCreateRole(name: string) {
  return Role.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, description: name === 'admin' ? 'Administrator' : 'Standard user' } },
    { upsert: true, returnDocument: 'after' },
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim().toLowerCase();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const {
    districtId, subcountyId, parishId, villageId,
  } = body as Record<string, string | undefined>;

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3–50 characters.' },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  const locationIds = [districtId, subcountyId, parishId, villageId];
  if (locationIds.some((id) => id && !Types.ObjectId.isValid(id))) {
    return NextResponse.json({ error: 'Invalid location selection.' }, { status: 400 });
  }
  if (!districtId || !Types.ObjectId.isValid(districtId)) {
    return NextResponse.json({ error: 'District is required.' }, { status: 400 });
  }
  if (!subcountyId || !Types.ObjectId.isValid(subcountyId)) {
    return NextResponse.json({ error: 'Subcounty is required.' }, { status: 400 });
  }
  if (!parishId || !Types.ObjectId.isValid(parishId)) {
    return NextResponse.json({ error: 'Parish is required.' }, { status: 400 });
  }
  if (!villageId || !Types.ObjectId.isValid(villageId)) {
    return NextResponse.json({ error: 'Village or cell is required.' }, { status: 400 });
  }

  try {
    await connectDB();

    const [district, subcounty, parish, village, existing] = await Promise.all([
      District.findById(districtId).select('_id name').lean(),
      Subcounty.findOne({ _id: subcountyId, districtId }).select('_id name').lean(),
      Parish.findOne({ _id: parishId, subcountyId }).select('_id name').lean(),
      Village.findOne({ _id: villageId, parishId }).select('_id name type').lean(),
      User.findOne({ email }).select('_id').lean(),
    ]);

    if (!district) {
      return NextResponse.json({ error: 'Selected district not found.' }, { status: 400 });
    }
    if (!subcounty) {
      return NextResponse.json({ error: 'Selected subcounty does not belong to this district.' }, { status: 400 });
    }
    if (!parish) {
      return NextResponse.json({ error: 'Selected parish does not belong to this subcounty.' }, { status: 400 });
    }
    if (!village) {
      return NextResponse.json({ error: 'Selected village or cell does not belong to this parish.' }, { status: 400 });
    }
    if (existing) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userRole = await getOrCreateRole('user');

    await User.create({
      username,
      email,
      passwordHash,
      role: userRole._id,
      districtId: district._id,
      districtName: district.name,
      ...(subcounty ? { subcountyId: subcounty._id, subcountyName: subcounty.name } : {}),
      ...(parish ? { parishId: parish._id, parishName: parish.name } : {}),
      ...(village ? { villageId: village._id, villageName: village.name, villageType: village.type } : {}),
    });

    logActivity({ type: 'auth.register', action: `User "${username}" registered`, actorName: username, req });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 });
  }
}
