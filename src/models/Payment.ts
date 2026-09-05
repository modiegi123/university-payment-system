import mongoose, { Document, Schema } from 'mongoose';

export interface IBankingDetails {
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  branchCode: string;
  accountType: 'savings' | 'cheque' | 'current';
}

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId;
  registrationCycleId: mongoose.Types.ObjectId;
  paymentReference: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency: string;
  bankingDetails: IBankingDetails;
  selectedCampus: string;
  selectedSubjects: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    fee: number;
  }>;
  residenceApplication?: {
    applied: boolean;
    residenceType: 'on-campus' | 'off-campus';
    preferences: string[];
  };
  paymentSummary: {
    registrationFee: number;
    subjectFees: number;
    residenceFee?: number;
    totalAmount: number;
    lateFee?: number;
  };
  authorizationDetails?: {
    authorizationCode: string;
    authorizedAt: Date;
    expiresAt: Date;
  };
  captureDetails?: {
    captureCode: string;
    capturedAt: Date;
    transactionId: string;
  };
  refundDetails?: {
    refundReference: string;
    refundedAt: Date;
    refundAmount: number;
    reason: string;
  };
  failureReason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BankingDetailsSchema = new Schema<IBankingDetails>({
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  accountHolder: {
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
  accountType: {
    type: String,
    required: true,
    enum: ['savings', 'cheque', 'current']
  }
}, { _id: false });

const PaymentSchema = new Schema<IPayment>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  registrationCycleId: {
    type: Schema.Types.ObjectId,
    ref: 'RegistrationCycle',
    required: true
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'ZAR'
  },
  bankingDetails: {
    type: BankingDetailsSchema,
    required: true
  },
  selectedCampus: {
    type: String,
    required: true
  },
  selectedSubjects: [{
    subjectId: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      required: true
    },
    subjectName: {
      type: String,
      required: true
    },
    credits: {
      type: Number,
      required: true
    },
    fee: {
      type: Number,
      required: true
    }
  }],
  residenceApplication: {
    applied: {
      type: Boolean,
      default: false
    },
    residenceType: {
      type: String,
      enum: ['on-campus', 'off-campus']
    },
    preferences: [String]
  },
  paymentSummary: {
    registrationFee: {
      type: Number,
      required: true
    },
    subjectFees: {
      type: Number,
      required: true
    },
    residenceFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    lateFee: {
      type: Number,
      default: 0
    }
  },
  authorizationDetails: {
    authorizationCode: {
      type: String,
      trim: true
    },
    authorizedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  captureDetails: {
    captureCode: {
      type: String,
      trim: true
    },
    capturedAt: {
      type: Date
    },
    transactionId: {
      type: String,
      trim: true
    }
  },
  refundDetails: {
    refundReference: {
      type: String,
      trim: true
    },
    refundedAt: {
      type: Date
    },
    refundAmount: {
      type: Number
    },
    reason: {
      type: String,
      trim: true
    }
  },
  failureReason: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
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
PaymentSchema.index({ studentId: 1 });
PaymentSchema.index({ registrationCycleId: 1 });
PaymentSchema.index({ paymentReference: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
