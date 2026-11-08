import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import District from '@/models/District';

export async function GET() {
  try {
    await connectDB();
    const districts = await District.find()
      .select('_id name region')
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(districts);
  } catch (err) {
    console.error('[GET /api/locations/districts]', err);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
  }
}
