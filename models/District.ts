import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDistrict extends Document {
  _id: Types.ObjectId;
  name: string;
  region: string;         // e.g. "Central", "Northern", "Eastern", "Western"
  population?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    region: { type: String, required: true, trim: true },
    population: { type: Number },
  },
  { timestamps: true },
);

DistrictSchema.index({ region: 1 });

const District: Model<IDistrict> =
  mongoose.models.District ||
  mongoose.model<IDistrict>('District', DistrictSchema);

export default District;
