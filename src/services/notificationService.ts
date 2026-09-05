import Student from '../models/Student';
import Payment from '../models/Payment';
import Transaction from '../models/Transaction';

export interface NotificationPayload {
  studentId: string;
  type: 'payment_authorized' | 'payment_captured' | 'payment_failed' | 'payment_refunded' | 'registration_cycle_open' | 'registration_cycle_closing';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  // Send WhatsApp notification (placeholder for actual WhatsApp integration)
  static async sendWhatsAppNotification(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with WhatsApp Business API
      console.log(`📱 WhatsApp notification to ${phoneNumber}: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just log the notification
      console.log(`✅ WhatsApp notification sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send WhatsApp notification:', error);
      return false;
    }
  }

  // Send email notification (placeholder for actual email service)
  static async sendEmailNotification(email: string, subject: string, message: string): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service like SendGrid, AWS SES, etc.
      console.log(`📧 Email notification to ${email}: ${subject} - ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`✅ Email notification sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
      return false;
    }
  }

  // Send payment authorized notification
  static async notifyPaymentAuthorized(paymentId: string): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId).populate('studentId');
      if (!payment) return;

      const student = payment.studentId as any;
      const message = `🎉 Payment authorized successfully!\n\nPayment Reference: ${payment.paymentReference}\nAmount: R${payment.amount}\n\nYour payment has been authorized and is ready for capture after successful registration.`;

      // Send WhatsApp notification
      if (student.whatsappNumber) {
        await this.sendWhatsAppNotification(student.whatsappNumber, message);
      }

      // Send email notification
      await this.sendEmailNotification(
        student.email,
        'Payment Authorized - University Registration',
        message
      );

      console.log(`✅ Payment authorized notification sent for payment ${payment.paymentReference}`);
    } catch (error) {
      console.error('❌ Failed to send payment authorized notification:', error);
    }
  }

  // Send payment captured notification
  static async notifyPaymentCaptured(paymentId: string): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId).populate('studentId');
      if (!payment) return;

      const student = payment.studentId as any;
      const message = `✅ Payment captured successfully!\n\nPayment Reference: ${payment.paymentReference}\nAmount: R${payment.amount}\nTransaction ID: ${payment.captureDetails?.transactionId}\n\nYour registration is now complete!`;

      // Send WhatsApp notification
      if (student.whatsappNumber) {
        await this.sendWhatsAppNotification(student.whatsappNumber, message);
      }

      // Send email notification
      await this.sendEmailNotification(
        student.email,
        'Payment Captured - Registration Complete',
        message
      );

      console.log(`✅ Payment captured notification sent for payment ${payment.paymentReference}`);
    } catch (error) {
      console.error('❌ Failed to send payment captured notification:', error);
    }
  }

  // Send payment failed notification
  static async notifyPaymentFailed(paymentId: string, reason: string): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId).populate('studentId');
      if (!payment) return;

      const student = payment.studentId as any;
      const message = `❌ Payment failed!\n\nPayment Reference: ${payment.paymentReference}\nAmount: R${payment.amount}\nReason: ${reason}\n\nPlease try again or contact support.`;

      // Send WhatsApp notification
      if (student.whatsappNumber) {
        await this.sendWhatsAppNotification(student.whatsappNumber, message);
      }

      // Send email notification
      await this.sendEmailNotification(
        student.email,
        'Payment Failed - University Registration',
        message
      );

      console.log(`✅ Payment failed notification sent for payment ${payment.paymentReference}`);
    } catch (error) {
      console.error('❌ Failed to send payment failed notification:', error);
    }
  }

  // Send payment refunded notification
  static async notifyPaymentRefunded(paymentId: string): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId).populate('studentId');
      if (!payment) return;

      const student = payment.studentId as any;
      const message = `💰 Refund processed!\n\nPayment Reference: ${payment.paymentReference}\nRefund Amount: R${payment.refundDetails?.refundAmount}\nRefund Reference: ${payment.refundDetails?.refundReference}\nReason: ${payment.refundDetails?.reason}\n\nYour refund has been processed and will reflect in your account within 3-5 business days.`;

      // Send WhatsApp notification
      if (student.whatsappNumber) {
        await this.sendWhatsAppNotification(student.whatsappNumber, message);
      }

      // Send email notification
      await this.sendEmailNotification(
        student.email,
        'Refund Processed - University Registration',
        message
      );

      console.log(`✅ Payment refunded notification sent for payment ${payment.paymentReference}`);
    } catch (error) {
      console.error('❌ Failed to send payment refunded notification:', error);
    }
  }

  // Send registration cycle opening notification
  static async notifyRegistrationCycleOpen(cycleId: string): Promise<void> {
    try {
      // In a real implementation, this would send notifications to all active students
      console.log(`📢 Registration cycle ${cycleId} is now open!`);
      
      // This would typically involve:
      // 1. Getting all active students
      // 2. Sending bulk WhatsApp/email notifications
      // 3. Logging the notification campaign
      
      console.log(`✅ Registration cycle opening notification sent`);
    } catch (error) {
      console.error('❌ Failed to send registration cycle opening notification:', error);
    }
  }

  // Send registration cycle closing reminder
  static async notifyRegistrationCycleClosing(cycleId: string, daysLeft: number): Promise<void> {
    try {
      // In a real implementation, this would send notifications to students who haven't registered yet
      console.log(`⏰ Registration cycle ${cycleId} closes in ${daysLeft} days!`);
      
      console.log(`✅ Registration cycle closing reminder sent`);
    } catch (error) {
      console.error('❌ Failed to send registration cycle closing reminder:', error);
    }
  }

  // Send custom notification
  static async sendCustomNotification(payload: NotificationPayload): Promise<void> {
    try {
      const student = await Student.findById(payload.studentId);
      if (!student) return;

      const message = `${payload.title}\n\n${payload.message}`;

      // Send WhatsApp notification
      if (student.whatsappNumber) {
        await this.sendWhatsAppNotification(student.whatsappNumber, message);
      }

      // Send email notification
      await this.sendEmailNotification(
        student.email,
        payload.title,
        payload.message
      );

      console.log(`✅ Custom notification sent to student ${student.studentNumber}`);
    } catch (error) {
      console.error('❌ Failed to send custom notification:', error);
    }
  }
}


