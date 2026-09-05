import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  studentNumber: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  whatsappNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const StudentSchema = new Schema<IStudent>({
  studentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  whatsappNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes for performance
StudentSchema.index({ studentNumber: 1 });
StudentSchema.index({ email: 1 });
StudentSchema.index({ phoneNumber: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
