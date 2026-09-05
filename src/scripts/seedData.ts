import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RegistrationCycle from '../models/RegistrationCycle';
import Student from '../models/Student';

// Load environment variables
dotenv.config();

const seedRegistrationCycles = async () => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  const cycles = [
    {
      name: 'Demo Registration Cycle (Always Open)',
      description: 'A demo registration cycle kept open year-round so this project can be tried out live.',
      academicYear: `${now.getFullYear()}`,
      semester: '1',
      startDate: oneYearAgo,
      endDate: oneYearAhead,
      isActive: true,
      fees: {
        registrationFee: 5000,
        lateRegistrationFee: 1000,
        residenceApplicationFee: 2000
      },
      bankingDetails: {
        accountNumber: '1234567890',
        accountName: 'University of Technology',
        bankName: 'Standard Bank',
        branchCode: '051001',
        reference: 'UNI-REG-DEMO'
      },
      campuses: [
        { id: 'main-campus', name: 'Main Campus', isActive: true },
        { id: 'north-campus', name: 'North Campus', isActive: true },
        { id: 'south-campus', name: 'South Campus', isActive: true }
      ],
      subjects: [
        { id: 'subj-d01', code: 'MATH101', name: 'Mathematics 101', credits: 12, fee: 3000, campus: 'main-campus', isActive: true },
        { id: 'subj-d02', code: 'ENG101', name: 'English 101', credits: 12, fee: 2500, campus: 'main-campus', isActive: true },
        { id: 'subj-d03', code: 'CS101', name: 'Computer Science 101', credits: 15, fee: 4000, campus: 'main-campus', isActive: true },
        { id: 'subj-d04', code: 'PHYS101', name: 'Physics 101', credits: 12, fee: 3500, campus: 'north-campus', isActive: true },
        { id: 'subj-d05', code: 'CHEM101', name: 'Chemistry 101', credits: 12, fee: 3200, campus: 'south-campus', isActive: true }
      ]
    },
    {
      name: '2024 Semester 1 Registration',
      description: 'Registration for the first semester of 2024',
      academicYear: '2024',
      semester: '1',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-15'),
      isActive: true,
      fees: {
        registrationFee: 5000,
        lateRegistrationFee: 1000,
        residenceApplicationFee: 2000
      },
      bankingDetails: {
        accountNumber: '1234567890',
        accountName: 'University of Technology',
        bankName: 'Standard Bank',
        branchCode: '051001',
        reference: 'UNI-REG-2024'
      },
      campuses: [
        {
          id: 'main-campus',
          name: 'Main Campus',
          isActive: true
        },
        {
          id: 'north-campus',
          name: 'North Campus',
          isActive: true
        },
        {
          id: 'south-campus',
          name: 'South Campus',
          isActive: true
        }
      ],
      subjects: [
        {
          id: 'subj-001',
          code: 'MATH101',
          name: 'Mathematics 101',
          credits: 12,
          fee: 3000,
          campus: 'main-campus',
          isActive: true
        },
        {
          id: 'subj-002',
          code: 'ENG101',
          name: 'English 101',
          credits: 12,
          fee: 2500,
          campus: 'main-campus',
          isActive: true
        },
        {
          id: 'subj-003',
          code: 'CS101',
          name: 'Computer Science 101',
          credits: 15,
          fee: 4000,
          campus: 'main-campus',
          isActive: true
        },
        {
          id: 'subj-004',
          code: 'PHYS101',
          name: 'Physics 101',
          credits: 12,
          fee: 3500,
          campus: 'north-campus',
          isActive: true
        },
        {
          id: 'subj-005',
          code: 'CHEM101',
          name: 'Chemistry 101',
          credits: 12,
          fee: 3200,
          campus: 'south-campus',
          isActive: true
        }
      ]
    },
    {
      name: '2024 Semester 2 Registration',
      description: 'Registration for the second semester of 2024',
      academicYear: '2024',
      semester: '2',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-07-15'),
      isActive: true,
      fees: {
        registrationFee: 5000,
        lateRegistrationFee: 1000,
        residenceApplicationFee: 2000
      },
      bankingDetails: {
        accountNumber: '1234567890',
        accountName: 'University of Technology',
        bankName: 'Standard Bank',
        branchCode: '051001',
        reference: 'UNI-REG-2024-S2'
      },
      campuses: [
        {
          id: 'main-campus',
          name: 'Main Campus',
          isActive: true
        },
        {
          id: 'north-campus',
          name: 'North Campus',
          isActive: true
        },
        {
          id: 'south-campus',
          name: 'South Campus',
          isActive: true
        }
      ],
      subjects: [
        {
          id: 'subj-101',
          code: 'MATH102',
          name: 'Mathematics 102',
          credits: 12,
          fee: 3000,
          campus: 'main-campus',
          isActive: true
        },
        {
          id: 'subj-102',
          code: 'ENG102',
          name: 'English 102',
          credits: 12,
          fee: 2500,
          campus: 'main-campus',
          isActive: true
        },
        {
          id: 'subj-103',
          code: 'CS102',
          name: 'Computer Science 102',
          credits: 15,
          fee: 4000,
          campus: 'main-campus',
          isActive: true
        }
      ]
    }
  ];

  for (const cycleData of cycles) {
    const existingCycle = await RegistrationCycle.findOne({
      academicYear: cycleData.academicYear,
      semester: cycleData.semester
    });

    if (!existingCycle) {
      const cycle = new RegistrationCycle(cycleData);
      await cycle.save();
      console.log(`✅ Created registration cycle: ${cycle.name}`);
    } else {
      console.log(`⚠️ Registration cycle already exists: ${cycleData.name}`);
    }
  }
};

const seedStudents = async () => {
  const students = [
    {
      studentNumber: 'STU001',
      email: 'john.doe@student.university.ac.za',
      phoneNumber: '+27123456789',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('2000-01-15'),
      whatsappNumber: '+27123456789',
      isActive: true
    },
    {
      studentNumber: 'STU002',
      email: 'jane.smith@student.university.ac.za',
      phoneNumber: '+27123456790',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1999-05-20'),
      whatsappNumber: '+27123456790',
      isActive: true
    },
    {
      studentNumber: 'STU003',
      email: 'bob.johnson@student.university.ac.za',
      phoneNumber: '+27123456791',
      firstName: 'Bob',
      lastName: 'Johnson',
      dateOfBirth: new Date('2001-03-10'),
      whatsappNumber: '+27123456791',
      isActive: true
    }
  ];

  for (const studentData of students) {
    const existingStudent = await Student.findOne({
      studentNumber: studentData.studentNumber
    });

    if (!existingStudent) {
      const student = new Student(studentData);
      await student.save();
      console.log(`✅ Created student: ${student.studentNumber} - ${student.firstName} ${student.lastName}`);
    } else {
      console.log(`⚠️ Student already exists: ${studentData.studentNumber}`);
    }
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university_payment_system');
    console.log('✅ Connected to MongoDB');

    // Seed data
    await seedRegistrationCycles();
    await seedStudents();

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };


