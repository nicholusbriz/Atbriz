import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import District from '@/models/District';
import Subcounty from '@/models/Subcounty';
import Parish from '@/models/Parish';
import Village from '@/models/Village';

type LocationLevel = 'subcounty' | 'parish' | 'village';
type VillageType = 'village' | 'cell';

function isLocationLevel(value: unknown): value is LocationLevel {
  return value === 'subcounty' || value === 'parish' || value === 'village';
}

function isVillageType(value: unknown): value is VillageType {
  return value === 'village' || value === 'cell';
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && Types.ObjectId.isValid(value);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      districtId?: unknown;
      level?: unknown;
      parentId?: unknown;
      name?: unknown;
      type?: unknown;
    };

    if (!isObjectId(body.districtId) || !isLocationLevel(body.level)) {
      return NextResponse.json({ error: 'A valid districtId and level are required' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) {
      return NextResponse.json({ error: 'Name must be between 1 and 120 characters' }, { status: 400 });
    }

    await connectDB();
    const district = await District.findById(body.districtId);
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

    if (body.level === 'subcounty') {
      if (body.parentId !== body.districtId) {
        return NextResponse.json({ error: 'Subcounties must belong to the selected district' }, { status: 400 });
      }

      const location = await Subcounty.create({
        name,
        districtId: district._id,
        districtName: district.name,
      });
      return NextResponse.json({ id: location._id, name: location.name }, { status: 201 });
    }

    if (!isObjectId(body.parentId)) {
      return NextResponse.json({ error: 'A valid parent location is required' }, { status: 400 });
    }

    if (body.level === 'parish') {
      const subcounty = await Subcounty.findById(body.parentId);
      if (!subcounty || subcounty.districtId.toString() !== district._id.toString()) {
        return NextResponse.json({ error: 'Subcounty not found in selected district' }, { status: 404 });
      }

      const location = await Parish.create({
        name,
        subcountyId: subcounty._id,
        subcountyName: subcounty.name,
        districtId: district._id,
        districtName: district.name,
      });
      return NextResponse.json({ id: location._id, name: location.name }, { status: 201 });
    }

    if (!isVillageType(body.type)) {
      return NextResponse.json({ error: 'Village type must be village or cell' }, { status: 400 });
    }

    const parish = await Parish.findById(body.parentId);
    if (!parish || parish.districtId.toString() !== district._id.toString()) {
      return NextResponse.json({ error: 'Parish not found in selected district' }, { status: 404 });
    }

    const location = await Village.create({
      name,
      type: body.type,
      parishId: parish._id,
      parishName: parish.name,
      subcountyId: parish.subcountyId,
      subcountyName: parish.subcountyName,
      districtId: district._id,
      districtName: district.name,
    });
    return NextResponse.json({ id: location._id, name: location.name, type: location.type }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'A location with this name already exists under the selected parent' }, { status: 409 });
    }
    console.error('[POST /api/admin/sync/locations]', error);
    return NextResponse.json({ error: 'Failed to add location' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      districtId?: unknown;
      level?: unknown;
      id?: unknown;
      name?: unknown;
      type?: unknown;
    };

    if (!isObjectId(body.districtId) || !isObjectId(body.id) || !isLocationLevel(body.level)) {
      return NextResponse.json({ error: 'Valid districtId, id, and level are required' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) {
      return NextResponse.json({ error: 'Name must be between 1 and 120 characters' }, { status: 400 });
    }

    await connectDB();
    const district = await District.findById(body.districtId);
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

    if (body.level === 'subcounty') {
      const location = await Subcounty.findById(body.id);
      if (!location || location.districtId.toString() !== district._id.toString()) {
        return NextResponse.json({ error: 'Subcounty not found in selected district' }, { status: 404 });
      }
      location.name = name;
      await location.save();
      await Promise.all([
        Parish.updateMany({ subcountyId: location._id }, { $set: { subcountyName: name } }),
        Village.updateMany({ subcountyId: location._id }, { $set: { subcountyName: name } }),
      ]);
      return NextResponse.json({ id: location._id, name: location.name });
    }

    if (body.level === 'parish') {
      const location = await Parish.findById(body.id);
      if (!location || location.districtId.toString() !== district._id.toString()) {
        return NextResponse.json({ error: 'Parish not found in selected district' }, { status: 404 });
      }
      location.name = name;
      await location.save();
      await Village.updateMany({ parishId: location._id }, { $set: { parishName: name } });
      return NextResponse.json({ id: location._id, name: location.name });
    }

    const location = await Village.findById(body.id);
    if (!location || location.districtId.toString() !== district._id.toString()) {
      return NextResponse.json({ error: 'Village or cell not found in selected district' }, { status: 404 });
    }
    if (body.type !== undefined) {
      if (!isVillageType(body.type)) {
        return NextResponse.json({ error: 'Village type must be village or cell' }, { status: 400 });
      }
      location.type = body.type;
    }
    location.name = name;
    await location.save();
    return NextResponse.json({ id: location._id, name: location.name, type: location.type });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'A location with this name already exists under the selected parent' }, { status: 409 });
    }
    console.error('[PATCH /api/admin/sync/locations]', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as {
      districtId?: unknown;
      level?: unknown;
      id?: unknown;
    };

    if (!isObjectId(body.districtId) || !isObjectId(body.id) || !isLocationLevel(body.level)) {
      return NextResponse.json({ error: 'Valid districtId, id, and level are required' }, { status: 400 });
    }

    await connectDB();
    const district = await District.findById(body.districtId);
    if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

    if (body.level === 'subcounty') {
      const location = await Subcounty.findById(body.id);
      if (!location || location.districtId.toString() !== district._id.toString()) {
        return NextResponse.json({ error: 'Subcounty not found in selected district' }, { status: 404 });
      }
      if (await Parish.exists({ subcountyId: location._id })) {
        return NextResponse.json({
          error: 'Cannot delete this subcounty while it has parishes or wards. Delete those first.',
        }, { status: 409 });
      }
      await location.deleteOne();
      return NextResponse.json({ deleted: true });
    }

    if (body.level === 'parish') {
      const location = await Parish.findById(body.id);
      if (!location || location.districtId.toString() !== district._id.toString()) {
        return NextResponse.json({ error: 'Parish not found in selected district' }, { status: 404 });
      }
      if (await Village.exists({ parishId: location._id })) {
        return NextResponse.json({
          error: 'Cannot delete this parish while it has villages or cells. Delete those first.',
        }, { status: 409 });
      }
      await location.deleteOne();
      return NextResponse.json({ deleted: true });
    }

    const location = await Village.findById(body.id);
    if (!location || location.districtId.toString() !== district._id.toString()) {
      return NextResponse.json({ error: 'Village or cell not found in selected district' }, { status: 404 });
    }
    await location.deleteOne();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/admin/sync/locations]', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
