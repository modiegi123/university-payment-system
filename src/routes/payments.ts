import express, { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment';
import RegistrationCycle from '../models/RegistrationCycle';
import Transaction from '../models/Transaction';
import { EncryptionService } from '../utils/encryption';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Create payment authorization (capture banking details but don't debit yet)
router.post('/authorize', [
  body('registrationCycleId')
    .isMongoId()
    .withMessage('Valid registration cycle ID is required'),
  body('selectedCampus')
    .notEmpty()
    .withMessage('Campus selection is required'),
  body('selectedSubjects')
    .isArray({ min: 1 })
    .withMessage('At least one subject must be selected'),
  body('selectedSubjects.*.subjectId')
    .notEmpty()
    .withMessage('Subject ID is required'),
  body('bankingDetails.accountNumber')
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be between 8 and 20 characters'),
  body('bankingDetails.accountHolder')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account holder name is required'),
  body('bankingDetails.bankName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Bank name is required'),
  body('bankingDetails.branchCode')
    .isLength({ min: 3, max: 10 })
    .withMessage('Branch code is required'),
  body('bankingDetails.accountType')
    .isIn(['savings', 'cheque', 'current'])
    .withMessage('Valid account type is required'),
  body('residenceApplication.applied')
    .optional()
    .isBoolean()
    .withMessage('Residence application must be boolean'),
  body('residenceApplication.residenceType')
    .optional()
    .isIn(['on-campus', 'off-campus'])
    .withMessage('Valid residence type is required')
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      registrationCycleId,
      selectedCampus,
      selectedSubjects,
      bankingDetails,
      residenceApplication
    } = req.body;

    // Get registration cycle
    const cycle = await RegistrationCycle.findById(registrationCycleId);
    if (!cycle || !cycle.isActive) {
      return res.status(404).json({
        error: 'Registration cycle not found or inactive',
        code: 'CYCLE_NOT_FOUND'
      });
    }

    // Validate campus selection
    const validCampus = cycle.campuses.find(c => c.id === selectedCampus && c.isActive);
    if (!validCampus) {
      return res.status(400).json({
        error: 'Invalid campus selection',
        code: 'INVALID_CAMPUS'
      });
    }

    // Validate subjects
    const validSubjects = selectedSubjects.filter((subject: any) => {
      return cycle.subjects.find(s => s.id === subject.subjectId && s.isActive);
    });

    if (validSubjects.length !== selectedSubjects.length) {
      return res.status(400).json({
        error: 'One or more subjects are invalid or inactive',
        code: 'INVALID_SUBJECTS'
      });
    }

    // Calculate fees
    const subjectFees = validSubjects.reduce((total: number, subject: any) => {
      const cycleSubject = cycle.subjects.find(s => s.id === subject.subjectId);
      return total + (cycleSubject?.fee || 0);
    }, 0);

    const residenceFee = residenceApplication?.applied ? cycle.fees.residenceApplicationFee || 0 : 0;
    const totalAmount = cycle.fees.registrationFee + subjectFees + residenceFee;

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      studentId: req.user!.id,
      registrationCycleId,
      status: { $in: ['pending', 'authorized'] }
    });

    if (existingPayment) {
      return res.status(409).json({
        error: 'Payment already exists for this registration cycle',
        code: 'PAYMENT_EXISTS',
        paymentId: existingPayment._id
      });
    }

    // Encrypt banking details
    const encryptedBankingDetails = {
      accountNumber: EncryptionService.encrypt(bankingDetails.accountNumber),
      accountHolder: EncryptionService.encrypt(bankingDetails.accountHolder),
      bankName: EncryptionService.encrypt(bankingDetails.bankName),
      branchCode: EncryptionService.encrypt(bankingDetails.branchCode),
      accountType: bankingDetails.accountType
    };

    // Create payment record
    const payment = new Payment({
      studentId: req.user!.id,
      registrationCycleId,
      paymentReference: EncryptionService.generatePaymentReference(),
      status: 'pending',
      amount: totalAmount,
      currency: 'ZAR',
      bankingDetails: encryptedBankingDetails,
      selectedCampus,
      selectedSubjects: validSubjects.map((subject: any) => {
        const cycleSubject = cycle.subjects.find(s => s.id === subject.subjectId);
        return {
          subjectId: subject.subjectId,
          subjectCode: cycleSubject?.code || '',
          subjectName: cycleSubject?.name || '',
          credits: cycleSubject?.credits || 0,
          fee: cycleSubject?.fee || 0
        };
      }),
      residenceApplication: residenceApplication || { applied: false },
      paymentSummary: {
        registrationFee: cycle.fees.registrationFee,
        subjectFees: subjectFees,
        residenceFee: residenceFee,
        totalAmount: totalAmount,
        lateFee: 0
      }
    });

    await payment.save();

    // Create authorization transaction
    const transaction = new Transaction({
      paymentId: payment._id,
      studentId: req.user!.id,
      type: 'authorization',
      status: 'pending',
      amount: totalAmount,
      currency: 'ZAR',
      reference: EncryptionService.generateTransactionReference()
    });

    await transaction.save();

    // Simulate payment gateway authorization (in real implementation, call actual gateway)
    // For now, we'll simulate a successful authorization
    setTimeout(async () => {
      try {
        // Update transaction as successful
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'success',
          externalTransactionId: `AUTH-${Date.now()}`,
          processedAt: new Date(),
          gatewayResponse: {
            authorizationCode: `AUTH-${Date.now()}`,
            status: 'authorized'
          }
        });

        // Update payment as authorized
        await Payment.findByIdAndUpdate(payment._id, {
          status: 'authorized',
          authorizationDetails: {
            authorizationCode: `AUTH-${Date.now()}`,
            authorizedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        });

        console.log(`Payment ${payment.paymentReference} authorized successfully`);
      } catch (error) {
        console.error('Error updating authorization:', error);
      }
    }, 2000); // Simulate 2-second processing time

    res.status(201).json({
      message: 'Payment authorization initiated',
      payment: {
        id: payment._id,
        paymentReference: payment.paymentReference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        selectedCampus: payment.selectedCampus,
        selectedSubjects: payment.selectedSubjects,
        paymentSummary: payment.paymentSummary,
        authorizationDetails: payment.authorizationDetails
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Capture payment (debit the account after successful registration)
router.post('/capture/:paymentId', async (req: AuthRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      studentId: req.user!.id,
      status: 'authorized'
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Authorized payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Check if authorization is still valid
    if (payment.authorizationDetails && payment.authorizationDetails.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Payment authorization has expired',
        code: 'AUTHORIZATION_EXPIRED'
      });
    }

    // Create capture transaction
    const transaction = new Transaction({
      paymentId: payment._id,
      studentId: req.user!.id,
      type: 'capture',
      status: 'pending',
      amount: payment.amount,
      currency: payment.currency,
      reference: EncryptionService.generateTransactionReference()
    });

    await transaction.save();

    // Simulate payment gateway capture (in real implementation, call actual gateway)
    setTimeout(async () => {
      try {
        // Update transaction as successful
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'success',
          externalTransactionId: `CAP-${Date.now()}`,
          processedAt: new Date(),
          gatewayResponse: {
            captureCode: `CAP-${Date.now()}`,
            status: 'captured'
          }
        });

        // Update payment as captured
        await Payment.findByIdAndUpdate(payment._id, {
          status: 'captured',
          captureDetails: {
            captureCode: `CAP-${Date.now()}`,
            capturedAt: new Date(),
            transactionId: `CAP-${Date.now()}`
          }
        });

        console.log(`Payment ${payment.paymentReference} captured successfully`);
      } catch (error) {
        console.error('Error updating capture:', error);
      }
    }, 2000); // Simulate 2-second processing time

    res.json({
      message: 'Payment capture initiated',
      payment: {
        id: payment._id,
        paymentReference: payment.paymentReference,
        status: 'pending_capture',
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Get payment status
router.get('/:paymentId', async (req: AuthRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      studentId: req.user!.id
    }).populate('registrationCycleId', 'name academicYear semester');

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Get related transactions
    const transactions = await Transaction.find({
      paymentId: payment._id
    }).sort({ createdAt: -1 });

    res.json({
      payment: {
        id: payment._id,
        paymentReference: payment.paymentReference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        selectedCampus: payment.selectedCampus,
        selectedSubjects: payment.selectedSubjects,
        residenceApplication: payment.residenceApplication,
        paymentSummary: payment.paymentSummary,
        authorizationDetails: payment.authorizationDetails,
        captureDetails: payment.captureDetails,
        refundDetails: payment.refundDetails,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        registrationCycle: payment.registrationCycleId
      },
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        currency: t.currency,
        reference: t.reference,
        externalTransactionId: t.externalTransactionId,
        failureReason: t.failureReason,
        processedAt: t.processedAt,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    return next(error);
  }
});

// Get all payments for student
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query: any = { studentId: req.user!.id };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('registrationCycleId', 'name academicYear semester')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      payments: payments.map(payment => ({
        id: payment._id,
        paymentReference: payment.paymentReference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        selectedCampus: payment.selectedCampus,
        selectedSubjects: payment.selectedSubjects,
        paymentSummary: payment.paymentSummary,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        registrationCycle: payment.registrationCycleId
      })),
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Process refund
router.post('/refund/:paymentId', [
  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be positive')
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { paymentId } = req.params;
    const { reason, amount } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      studentId: req.user!.id,
      status: 'captured'
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Captured payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Check if already refunded
    if (payment.status === 'refunded') {
      return res.status(400).json({
        error: 'Payment already refunded',
        code: 'ALREADY_REFUNDED'
      });
    }

    const refundAmount = amount || payment.amount;

    // Create refund transaction
    const transaction = new Transaction({
      paymentId: payment._id,
      studentId: req.user!.id,
      type: 'refund',
      status: 'pending',
      amount: refundAmount,
      currency: payment.currency,
      reference: EncryptionService.generateRefundReference()
    });

    await transaction.save();

    // Simulate payment gateway refund (in real implementation, call actual gateway)
    setTimeout(async () => {
      try {
        // Update transaction as successful
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'success',
          externalTransactionId: `REF-${Date.now()}`,
          processedAt: new Date(),
          gatewayResponse: {
            refundCode: `REF-${Date.now()}`,
            status: 'refunded'
          }
        });

        // Update payment as refunded
        await Payment.findByIdAndUpdate(payment._id, {
          status: 'refunded',
          refundDetails: {
            refundReference: transaction.reference,
            refundedAt: new Date(),
            refundAmount: refundAmount,
            reason: reason
          }
        });

        console.log(`Payment ${payment.paymentReference} refunded successfully`);
      } catch (error) {
        console.error('Error updating refund:', error);
      }
    }, 3000); // Simulate 3-second processing time

    res.json({
      message: 'Refund initiated',
      refund: {
        paymentId: payment._id,
        refundReference: transaction.reference,
        amount: refundAmount,
        currency: payment.currency,
        reason: reason,
        status: 'pending'
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Cancel payment (before capture)
router.post('/cancel/:paymentId', async (req: AuthRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      studentId: req.user!.id,
      status: { $in: ['pending', 'authorized'] }
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found or cannot be cancelled',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Create reversal transaction if payment was authorized
    if (payment.status === 'authorized') {
      const transaction = new Transaction({
        paymentId: payment._id,
        studentId: req.user!.id,
        type: 'reversal',
        status: 'success',
        amount: 0,
        currency: payment.currency,
        reference: EncryptionService.generateTransactionReference(),
        processedAt: new Date(),
        gatewayResponse: {
          reversalCode: `REV-${Date.now()}`,
          status: 'reversed'
        }
      });

      await transaction.save();
    }

    // Update payment as cancelled
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'cancelled',
      failureReason: 'Cancelled by student'
    });

    res.json({
      message: 'Payment cancelled successfully',
      payment: {
        id: payment._id,
        paymentReference: payment.paymentReference,
        status: 'cancelled'
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
