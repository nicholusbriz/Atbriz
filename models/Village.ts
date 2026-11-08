import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Covers both rural villages and urban cells — 
 * `type` field tells them apart.
 */
export interface IVillage extends Document {
  _id: Types.ObjectId;
  name: string;
  type: 'village' | 'cell';
  parishId: Types.ObjectId;      // → Parish._id
  parishName: string;
  subcountyId: Types.ObjectId;   // denormalised → Subcounty._id
  subcountyName: string;
  districtId: Types.ObjectId;    // denormalised → District._id
  districtName: string;
  createdAt: Date;
  updatedAt: Date;
}

const VillageSchema = new Schema<IVillage>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['village', 'cell'], default: 'village' },
    parishId: { type: Schema.Types.ObjectId, ref: 'Parish', required: true },
    parishName: { type: String, required: true, trim: true },
    subcountyId: { type: Schema.Types.ObjectId, ref: 'Subcounty', required: true },
    subcountyName: { type: String, required: true, trim: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true },
    districtName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

VillageSchema.index({ parishId: 1, name: 1 }, { unique: true });
VillageSchema.index({ subcountyId: 1 });
VillageSchema.index({ districtId: 1 });

const Village: Model<IVillage> =
  mongoose.models.Village ||
  mongoose.model<IVillage>('Village', VillageSchema);

export default Village;
