import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISubcounty extends Document {
  _id: Types.ObjectId;
  name: string;
  districtId: Types.ObjectId;   // → District._id
  districtName: string;         // denormalised for quick display
  createdAt: Date;
  updatedAt: Date;
}

const SubcountySchema = new Schema<ISubcounty>(
  {
    name: { type: String, required: true, trim: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true },
    districtName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// One subcounty name can exist in multiple districts, so unique on (name + districtId)
SubcountySchema.index({ districtId: 1, name: 1 }, { unique: true });

const Subcounty: Model<ISubcounty> =
  mongoose.models.Subcounty ||
  mongoose.model<ISubcounty>('Subcounty', SubcountySchema);

export default Subcounty;
