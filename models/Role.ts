import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[]; // action permissions (see lib/access-map.ts)
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true },
);

const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
