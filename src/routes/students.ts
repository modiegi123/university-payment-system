import express from 'express';
import Student from '../models/Student';
import Payment from '../models/Payment';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get student dashboard data
router.get('/dashboard', async (req: AuthRequest, res, next) => {
  try {
    const student = await Student.findById(req.user!.id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    // Get recent payments
    const recentPayments = await Payment.find({ studentId: req.user!.id })
      .populate('registrationCycleId', 'name academicYear semester')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get payment statistics
    const paymentStats = await Payment.aggregate([
      { $match: { studentId: req.user!.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ studentId: req.user!.id })
      .populate('paymentId', 'paymentReference')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      student: {
        id: student._id,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        whatsappNumber: student.whatsappNumber,
        lastLoginAt: student.lastLoginAt
      },
      dashboard: {
        recentPayments: recentPayments.map(payment => ({
          id: payment._id,
          paymentReference: payment.paymentReference,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          selectedCampus: payment.selectedCampus,
          createdAt: payment.createdAt,
          registrationCycle: payment.registrationCycleId
        })),
        paymentStats: paymentStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount
          };
          return acc;
        }, {} as any),
        recentTransactions: recentTransactions.map(transaction => ({
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          reference: transaction.reference,
          processedAt: transaction.processedAt,
          createdAt: transaction.createdAt,
          payment: transaction.paymentId
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get student's payment history
router.get('/payments', async (req: AuthRequest, res, next) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query: any = { studentId: req.user!.id };
    if (status) {
      query.status = status;
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const payments = await Payment.find(query)
      .populate('registrationCycleId', 'name academicYear semester')
      .sort(sortOptions)
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
        residenceApplication: payment.residenceApplication,
        paymentSummary: payment.paymentSummary,
        authorizationDetails: payment.authorizationDetails,
        captureDetails: payment.captureDetails,
        refundDetails: payment.refundDetails,
        failureReason: payment.failureReason,
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
    next(error);
  }
});

// Get student's transaction history
router.get('/transactions', async (req: AuthRequest, res, next) => {
  try {
    const { type, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query: any = { studentId: req.user!.id };
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .populate('paymentId', 'paymentReference')
      .sort(sortOptions)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        reference: transaction.reference,
        externalTransactionId: transaction.externalTransactionId,
        failureReason: transaction.failureReason,
        processedAt: transaction.processedAt,
        createdAt: transaction.createdAt,
        payment: transaction.paymentId
      })),
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get student's payment statistics
router.get('/statistics', async (req: AuthRequest, res, next) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        dateFilter = { createdAt: { $gte: startDate } };
      }
    }

    // Payment statistics
    const paymentStats = await Payment.aggregate([
      { $match: { studentId: req.user!.id, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          refundedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          }
        }
      }
    ]);

    // Transaction statistics
    const transactionStats = await Transaction.aggregate([
      { $match: { studentId: req.user!.id, ...dateFilter } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Monthly payment trends
    const monthlyTrends = await Payment.aggregate([
      { $match: { studentId: req.user!.id, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      period: period,
      payments: paymentStats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedPayments: 0
      },
      transactions: transactionStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
          successful: stat.successful,
          failed: stat.failed
        };
        return acc;
      }, {} as any),
      trends: {
        monthly: monthlyTrends.map(trend => ({
          year: trend._id.year,
          month: trend._id.month,
          count: trend.count,
          totalAmount: trend.totalAmount
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

