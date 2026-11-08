import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IParish extends Document {
  _id: Types.ObjectId;
  name: string;
  subcountyId: Types.ObjectId;   // → Subcounty._id
  subcountyName: string;
  districtId: Types.ObjectId;    // denormalised → District._id
  districtName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParishSchema = new Schema<IParish>(
  {
    name: { type: String, required: true, trim: true },
    subcountyId: { type: Schema.Types.ObjectId, ref: 'Subcounty', required: true },
    subcountyName: { type: String, required: true, trim: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true },
    districtName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

ParishSchema.index({ subcountyId: 1, name: 1 }, { unique: true });
ParishSchema.index({ districtId: 1 });

const Parish: Model<IParish> =
  mongoose.models.Parish ||
  mongoose.model<IParish>('Parish', ParishSchema);

export default Parish;
