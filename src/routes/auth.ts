import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import Student from '../models/Student';
import { generateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Student registration
router.post('/register', [
  body('studentNumber')
    .isLength({ min: 6, max: 20 })
    .withMessage('Student number must be between 6 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Student number must contain only uppercase letters and numbers'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  body('whatsappNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid WhatsApp number is required if provided')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      studentNumber,
      email,
      phoneNumber,
      firstName,
      lastName,
      dateOfBirth,
      whatsappNumber
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { studentNumber: studentNumber.toUpperCase() },
        { email: email.toLowerCase() },
        { phoneNumber }
      ]
    });

    if (existingStudent) {
      return res.status(409).json({
        error: 'Student already exists',
        code: 'STUDENT_EXISTS',
        field: existingStudent.studentNumber === studentNumber.toUpperCase() ? 'studentNumber' :
               existingStudent.email === email.toLowerCase() ? 'email' : 'phoneNumber'
      });
    }

    // Create new student
    const student = new Student({
      studentNumber: studentNumber.toUpperCase(),
      email: email.toLowerCase(),
      phoneNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      whatsappNumber: whatsappNumber || phoneNumber,
      isActive: true
    });

    await student.save();

    // Generate JWT token
    const token = generateToken((student._id as any).toString(), student.studentNumber, student.email);

    return res.status(201).json({
      message: 'Student registered successfully',
      token,
      student: {
        id: student._id,
        studentNumber: student.studentNumber,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Student login
router.post('/login', [
  body('studentNumber')
    .notEmpty()
    .withMessage('Student number is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { studentNumber, email } = req.body;

    // Find student
    const student = await Student.findOne({
      studentNumber: studentNumber.toUpperCase(),
      email: email.toLowerCase(),
      isActive: true
    });

    if (!student) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    student.lastLoginAt = new Date();
    await student.save();

    // Generate JWT token
    const token = generateToken((student._id as any).toString(), student.studentNumber, student.email);

    return res.json({
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        studentNumber: student.studentNumber,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        lastLoginAt: student.lastLoginAt
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Get current student profile
router.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }
    
    const student = await Student.findById(req.user.id).select('-__v');
    
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    return res.json({
      student
    });
  } catch (error) {
    return next(error);
  }
});

// Update student profile
router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('whatsappNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid WhatsApp number is required if provided')
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, phoneNumber, whatsappNumber } = req.body;
    const updateData: any = {};

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (whatsappNumber) updateData.whatsappNumber = whatsappNumber;

    if (!req.user) {
      res.status(401).json({
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    return res.json({
      message: 'Profile updated successfully',
      student
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
