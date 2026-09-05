import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistrationCycle extends Document {
  name: string;
  description: string;
  academicYear: string;
  semester: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  fees: {
    registrationFee: number;
    lateRegistrationFee?: number;
    residenceApplicationFee?: number;
  };
  bankingDetails: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    branchCode: string;
    reference: string;
  };
  campuses: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  subjects: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    fee: number;
    campus: string;
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationCycleSchema = new Schema<IRegistrationCycle>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['1', '2', 'Summer', 'Winter']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fees: {
    registrationFee: {
      type: Number,
      required: true,
      min: 0
    },
    lateRegistrationFee: {
      type: Number,
      min: 0
    },
    residenceApplicationFee: {
      type: Number,
      min: 0
    }
  },
  bankingDetails: {
    accountNumber: {
      type: String,
      required: true,
      trim: true
    },
    accountName: {
      type: String,
      required: true,
      trim: true
    },
    bankName: {
      type: String,
      required: true,
      trim: true
    },
    branchCode: {
      type: String,
      required: true,
      trim: true
    },
    reference: {
      type: String,
      required: true,
      trim: true
    }
  },
  campuses: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  subjects: [{
    id: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    credits: {
      type: Number,
      required: true,
      min: 1
    },
    fee: {
      type: Number,
      required: true,
      min: 0
    },
    campus: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes
RegistrationCycleSchema.index({ academicYear: 1, semester: 1 });
RegistrationCycleSchema.index({ isActive: 1 });
RegistrationCycleSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<IRegistrationCycle>('RegistrationCycle', RegistrationCycleSchema);
