/**
 * GET /api/locations/children?parentId=<_id>&level=subcounty|parish|village
 *
 * All links use MongoDB ObjectId (_id). No external API references.
 *
 * district  _id → ?parentId=X&level=subcounty
 * subcounty _id → ?parentId=X&level=parish
 * parish    _id → ?parentId=X&level=village
 */
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import Subcounty from '@/models/Subcounty';
import Parish from '@/models/Parish';
import Village from '@/models/Village';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parentId = searchParams.get('parentId');
  const districtId = searchParams.get('districtId');
  const level = searchParams.get('level');
  const locationParentId = parentId ?? '';

  if (!level || !['subcounty', 'parish', 'village'].includes(level)) {
    return NextResponse.json({ error: 'A valid level is required' }, { status: 400 });
  }
  if (districtId && !Types.ObjectId.isValid(districtId)) {
    return NextResponse.json({ error: 'A valid districtId is required' }, { status: 400 });
  }
  if (!districtId && (!parentId || !Types.ObjectId.isValid(parentId))) {
    return NextResponse.json({ error: 'A valid parentId or districtId is required' }, { status: 400 });
  }

  try {
    await connectDB();

    if (districtId) {
      if (level === 'subcounty') {
        const results = await Subcounty.find({ districtId })
          .select('_id name districtName')
          .sort({ name: 1 })
          .lean();
        return NextResponse.json(results.map((item) => ({
          ...item,
          parentName: item.districtName,
        })));
      }

      if (level === 'parish') {
        const results = await Parish.find({ districtId })
          .select('_id name subcountyId subcountyName')
          .sort({ name: 1 })
          .lean();
        return NextResponse.json(results.map((item) => ({
          _id: item._id,
          name: item.name,
          parentId: item.subcountyId,
          parentName: item.subcountyName,
        })));
      }

      const results = await Village.find({ districtId })
        .select('_id name type parishId parishName')
        .sort({ name: 1 })
        .lean();
      return NextResponse.json(results.map((item) => ({
        _id: item._id,
        name: item.name,
        type: item.type,
        parentId: item.parishId,
        parentName: item.parishName,
      })));
    }

    if (level === 'subcounty') {
      const results = await Subcounty.find({ districtId: locationParentId })
        .select('_id name districtId districtName')
        .sort({ name: 1 })
        .lean();
      return NextResponse.json(results);
    }

    if (level === 'parish') {
      const results = await Parish.find({ subcountyId: locationParentId })
        .select('_id name subcountyId subcountyName')
        .sort({ name: 1 })
        .lean();
      return NextResponse.json(results);
    }

    if (level === 'village') {
      const results = await Village.find({ parishId: locationParentId })
        .select('_id name type parishId parishName')
        .sort({ name: 1 })
        .lean();
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: `Unknown level: ${level}` }, { status: 400 });

  } catch (err) {
    console.error('[GET /api/locations/children]', err);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
