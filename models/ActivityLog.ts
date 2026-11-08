import mongoose, { Schema, Document } from 'mongoose';

export const ACTIVITY_TYPES = [
  'auth.register',
  'auth.login',
  'auth.login_failed',
  'auth.logout',
  'user.role_change',
  'user.invalidate',
  'admin.invalidate_all',
  'report.create',
  'report.delete',
  'report.status_change',
  'sync.location_change',
  'access.permission_change',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface IActivityLog extends Document {
  type: ActivityType | string;
  action: string; // human-readable, e.g. 'User registered'
  actorId?: mongoose.Types.ObjectId; // who did it (null for anonymous)
  actorName?: string; // username/email snapshot
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    type: { type: String, required: true, index: true },
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivityLogSchema.index({ type: 1, createdAt: -1 });
ActivityLogSchema.index({ actorId: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

export default mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
