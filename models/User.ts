import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: Types.ObjectId; // → Role._id
  roleChangedAt?: Date; // tokens issued before this are invalid (forces re-login on role change)
  emailVerified: boolean;
  districtId?: Types.ObjectId;
  districtName?: string;
  subcountyId?: Types.ObjectId;
  subcountyName?: string;
  parishId?: Types.ObjectId;
  parishName?: string;
  villageId?: Types.ObjectId;
  villageName?: string;
  villageType?: 'village' | 'cell';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, lowercase: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    roleChangedAt: { type: Date },
    emailVerified: { type: Boolean, default: false },
    districtId: { type: Schema.Types.ObjectId, ref: 'District' },
    districtName: { type: String, trim: true },
    subcountyId: { type: Schema.Types.ObjectId, ref: 'Subcounty' },
    subcountyName: { type: String, trim: true },
    parishId: { type: Schema.Types.ObjectId, ref: 'Parish' },
    parishName: { type: String, trim: true },
    villageId: { type: Schema.Types.ObjectId, ref: 'Village' },
    villageName: { type: String, trim: true },
    villageType: { type: String, enum: ['village', 'cell'] },
  },
  { timestamps: true },
);

UserSchema.index({ districtId: 1 });
UserSchema.index({ username: 1 }); // login lookups (not unique — usernames may repeat)

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
