import express from 'express';
import { body, validationResult } from 'express-validator';
import RegistrationCycle from '../models/RegistrationCycle';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get active registration cycles
router.get('/cycles', async (req: AuthRequest, res, next) => {
  try {
    const { academicYear, semester } = req.query;
    
    const query: any = { isActive: true };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const cycles = await RegistrationCycle.find(query)
      .select('-__v')
      .sort({ startDate: -1 });

    res.json({
      cycles: cycles.map(cycle => ({
        id: cycle._id,
        name: cycle.name,
        description: cycle.description,
        academicYear: cycle.academicYear,
        semester: cycle.semester,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        fees: cycle.fees,
        bankingDetails: cycle.bankingDetails,
        campuses: cycle.campuses,
        subjects: cycle.subjects
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get specific registration cycle
router.get('/cycles/:cycleId', async (req: AuthRequest, res, next) => {
  try {
    const { cycleId } = req.params;

    const cycle = await RegistrationCycle.findById(cycleId);

    if (!cycle || !cycle.isActive) {
      return res.status(404).json({
        error: 'Registration cycle not found',
        code: 'CYCLE_NOT_FOUND'
      });
    }

    res.json({
      cycle: {
        id: cycle._id,
        name: cycle.name,
        description: cycle.description,
        academicYear: cycle.academicYear,
        semester: cycle.semester,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        fees: cycle.fees,
        bankingDetails: cycle.bankingDetails,
        campuses: cycle.campuses,
        subjects: cycle.subjects
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get student's registration status for a cycle
router.get('/cycles/:cycleId/status', async (req: AuthRequest, res, next) => {
  try {
    const { cycleId } = req.params;

    const cycle = await RegistrationCycle.findById(cycleId);
    if (!cycle || !cycle.isActive) {
      return res.status(404).json({
        error: 'Registration cycle not found',
        code: 'CYCLE_NOT_FOUND'
      });
    }

    // Check if cycle is currently open
    const now = new Date();
    const isOpen = now >= cycle.startDate && now <= cycle.endDate;
    const isUpcoming = now < cycle.startDate;
    const isClosed = now > cycle.endDate;

    // Get student's payment for this cycle
    const payment = await Payment.findOne({
      studentId: req.user!.id,
      registrationCycleId: cycleId
    }).populate('registrationCycleId', 'name academicYear semester');

    let registrationStatus = 'not_started';
    let paymentStatus = null;
    let canRegister = false;
    let canPay = false;

    if (payment) {
      paymentStatus = payment.status;
      
      switch (payment.status) {
        case 'pending':
        case 'authorized':
          registrationStatus = 'payment_authorized';
          canRegister = true;
          break;
        case 'captured':
          registrationStatus = 'registered';
          break;
        case 'failed':
        case 'cancelled':
          registrationStatus = 'payment_failed';
          canPay = true;
          break;
        case 'refunded':
          registrationStatus = 'refunded';
          canPay = true;
          break;
      }
    } else {
      if (isOpen) {
        registrationStatus = 'open';
        canPay = true;
      } else if (isUpcoming) {
        registrationStatus = 'upcoming';
      } else if (isClosed) {
        registrationStatus = 'closed';
      }
    }

    res.json({
      cycle: {
        id: cycle._id,
        name: cycle.name,
        academicYear: cycle.academicYear,
        semester: cycle.semester,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        fees: cycle.fees,
        bankingDetails: cycle.bankingDetails,
        campuses: cycle.campuses,
        subjects: cycle.subjects
      },
      registration: {
        status: registrationStatus,
        paymentStatus: paymentStatus,
        isOpen: isOpen,
        isUpcoming: isUpcoming,
        isClosed: isClosed,
        canRegister: canRegister,
        canPay: canPay,
        payment: payment ? {
          id: payment._id,
          paymentReference: payment.paymentReference,
          status: payment.status,
          amount: payment.amount,
          selectedCampus: payment.selectedCampus,
          selectedSubjects: payment.selectedSubjects,
          residenceApplication: payment.residenceApplication,
          paymentSummary: payment.paymentSummary,
          authorizationDetails: payment.authorizationDetails,
          captureDetails: payment.captureDetails,
          createdAt: payment.createdAt
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get available subjects for a campus
router.get('/cycles/:cycleId/subjects', async (req: AuthRequest, res, next) => {
  try {
    const { cycleId } = req.params;
    const { campus } = req.query;

    const cycle = await RegistrationCycle.findById(cycleId);
    if (!cycle || !cycle.isActive) {
      return res.status(404).json({
        error: 'Registration cycle not found',
        code: 'CYCLE_NOT_FOUND'
      });
    }

    let subjects = cycle.subjects.filter(subject => subject.isActive);
    
    if (campus) {
      subjects = subjects.filter(subject => subject.campus === campus);
    }

    res.json({
      subjects: subjects.map(subject => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        fee: subject.fee,
        campus: subject.campus
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Calculate registration fees
router.post('/cycles/:cycleId/calculate-fees', [
  body('selectedSubjects')
    .isArray({ min: 1 })
    .withMessage('At least one subject must be selected'),
  body('selectedSubjects.*.subjectId')
    .notEmpty()
    .withMessage('Subject ID is required'),
  body('residenceApplication.applied')
    .optional()
    .isBoolean()
    .withMessage('Residence application must be boolean')
], async (req: AuthRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { cycleId } = req.params;
    const { selectedSubjects, residenceApplication } = req.body;

    const cycle = await RegistrationCycle.findById(cycleId);
    if (!cycle || !cycle.isActive) {
      return res.status(404).json({
        error: 'Registration cycle not found',
        code: 'CYCLE_NOT_FOUND'
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

    res.json({
      feeBreakdown: {
        registrationFee: cycle.fees.registrationFee,
        subjectFees: subjectFees,
        residenceFee: residenceFee,
        totalAmount: totalAmount,
        lateFee: 0 // Could be calculated based on current date vs cycle dates
      },
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
      residenceApplication: residenceApplication || { applied: false }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

