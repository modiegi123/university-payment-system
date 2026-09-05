import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  paymentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'authorization' | 'capture' | 'refund' | 'reversal';
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  reference: string;
  externalTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['authorization', 'capture', 'refund', 'reversal']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed', 'cancelled'],
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
  reference: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  externalTransactionId: {
    type: String,
    trim: true
  },
  gatewayResponse: {
    type: Schema.Types.Mixed,
    default: {}
  },
  failureReason: {
    type: String,
    trim: true
  },
  processedAt: {
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
TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ studentId: 1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
