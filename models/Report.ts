import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { ReportAttachment } from '@/lib/report-attachments';

export const REPORT_CATEGORIES = [
  'Health',
  'Education',
  'Roads',
  'Water',
  'Corruption',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'rejected';

export interface IReport extends Document {
  referenceCode: string;
  title: string;
  category: ReportCategory;
  description: string;
  email?: string;
  attachments: ReportAttachment[];
  districtId: Types.ObjectId;
  districtName: string;
  subcountyId?: Types.ObjectId;
  subcountyName?: string;
  parishId?: Types.ObjectId;
  parishName?: string;
  villageId?: Types.ObjectId;
  villageName?: string;
  villageType?: 'village' | 'cell';
  status: ReportStatus;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    referenceCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: REPORT_CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    attachments: {
      type: [{
        publicId: { type: String, required: true },
        resourceType: { type: String, enum: ['image', 'video'], required: true },
        secureUrl: { type: String, required: true },
        format: { type: String, required: true },
        bytes: { type: Number, required: true },
      }],
      default: [],
    },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true, index: true },
    districtName: { type: String, required: true, trim: true },
    subcountyId: { type: Schema.Types.ObjectId, ref: 'Subcounty' },
    subcountyName: { type: String, trim: true },
    parishId: { type: Schema.Types.ObjectId, ref: 'Parish' },
    parishName: { type: String, trim: true },
    villageId: { type: Schema.Types.ObjectId, ref: 'Village' },
    villageName: { type: String, trim: true },
    villageType: { type: String, enum: ['village', 'cell'] },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

ReportSchema.index({ createdAt: -1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;
