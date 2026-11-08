import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginThrottle extends Document {
  key: string; // login identifier (email or username, lowercased)
  fails: number;
  blockedUntil?: Date;
  updatedAt: Date;
}

const LoginThrottleSchema = new Schema<ILoginThrottle>(
  {
    key: { type: String, required: true, unique: true },
    fails: { type: Number, default: 0 },
    blockedUntil: { type: Date },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export default mongoose.models.LoginThrottle ||
  mongoose.model<ILoginThrottle>('LoginThrottle', LoginThrottleSchema);
