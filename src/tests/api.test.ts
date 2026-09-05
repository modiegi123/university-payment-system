import request from 'supertest';
import app from '../server';

describe('University Payment System API', () => {
  let authToken: string;
  let studentId: string;
  let cycleId: string;

  beforeAll(async () => {
    // This would typically set up test database and seed data
    console.log('Setting up test environment...');
  });

  afterAll(async () => {
    // Clean up test database
    console.log('Cleaning up test environment...');
  });

  describe('Authentication', () => {
    it('should register a new student', async () => {
      const studentData = {
        studentNumber: 'TEST001',
        email: 'test@university.ac.za',
        phoneNumber: '+27123456789',
        firstName: 'Test',
        lastName: 'Student',
        dateOfBirth: '2000-01-01',
        whatsappNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(studentData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('student');
      expect(response.body.student.studentNumber).toBe('TEST001');
      
      authToken = response.body.token;
      studentId = response.body.student.id;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        studentNumber: 'TEST001',
        email: 'test@university.ac.za'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('student');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        studentNumber: 'INVALID',
        email: 'invalid@university.ac.za'
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('Registration Cycles', () => {
    it('should get active registration cycles', async () => {
      const response = await request(app)
        .get('/api/registration/cycles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycles');
      expect(Array.isArray(response.body.cycles)).toBe(true);
      
      if (response.body.cycles.length > 0) {
        cycleId = response.body.cycles[0].id;
      }
    });

    it('should get specific registration cycle', async () => {
      if (!cycleId) {
        console.log('No cycle ID available for testing');
        return;
      }

      const response = await request(app)
        .get(`/api/registration/cycles/${cycleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycle');
      expect(response.body.cycle).toHaveProperty('id');
      expect(response.body.cycle).toHaveProperty('name');
    });
  });

  describe('Payment Authorization', () => {
    it('should authorize payment with valid data', async () => {
      if (!cycleId) {
        console.log('No cycle ID available for testing');
        return;
      }

      const paymentData = {
        registrationCycleId: cycleId,
        selectedCampus: 'main-campus',
        selectedSubjects: [
          {
            subjectId: 'subj-001'
          }
        ],
        bankingDetails: {
          accountNumber: '1234567890',
          accountHolder: 'Test Student',
          bankName: 'Standard Bank',
          branchCode: '051001',
          accountType: 'savings'
        },
        residenceApplication: {
          applied: false
        }
      };

      const response = await request(app)
        .post('/api/payments/authorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('paymentReference');
      expect(response.body.payment).toHaveProperty('status');
    });

    it('should reject payment authorization with invalid data', async () => {
      const invalidPaymentData = {
        registrationCycleId: 'invalid-id',
        selectedCampus: 'invalid-campus',
        selectedSubjects: [],
        bankingDetails: {
          accountNumber: '123',
          accountHolder: '',
          bankName: '',
          branchCode: '',
          accountType: 'invalid'
        }
      };

      await request(app)
        .post('/api/payments/authorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe('Student Dashboard', () => {
    it('should get student dashboard data', async () => {
      const response = await request(app)
        .get('/api/students/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('student');
      expect(response.body).toHaveProperty('dashboard');
      expect(response.body.student).toHaveProperty('studentNumber');
    });

    it('should get student payment history', async () => {
      const response = await request(app)
        .get('/api/students/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});


