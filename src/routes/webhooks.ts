import express from 'express';
import { NotificationService } from '../services/notificationService';
import Payment from '../models/Payment';
import Transaction from '../models/Transaction';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Payment gateway webhook handler
router.post('/payment-gateway', async (req, res, next) => {
  try {
    const { event, data } = req.body;

    console.log(`🔔 Payment gateway webhook received: ${event}`);

    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(data);
        break;
      case 'payment.captured':
        await handlePaymentCaptured(data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      case 'payment.refunded':
        await handlePaymentRefunded(data);
        break;
      default:
        console.log(`⚠️ Unknown webhook event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    next(error);
  }
});

// WhatsApp webhook handler (for incoming messages)
router.post('/whatsapp', async (req, res, next) => {
  try {
    const { entry } = req.body;

    for (const webhookEntry of entry) {
      for (const change of webhookEntry.changes) {
        if (change.field === 'messages') {
          for (const message of change.value.messages) {
            await handleIncomingWhatsAppMessage(message);
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ WhatsApp webhook processing error:', error);
    next(error);
  }
});

// Registration cycle webhook handler
router.post('/registration-cycle', async (req, res, next) => {
  try {
    const { event, cycleId } = req.body;

    console.log(`🔔 Registration cycle webhook received: ${event}`);

    switch (event) {
      case 'cycle.opened':
        await NotificationService.notifyRegistrationCycleOpen(cycleId);
        break;
      case 'cycle.closing':
        const { daysLeft } = req.body;
        await NotificationService.notifyRegistrationCycleClosing(cycleId, daysLeft);
        break;
      default:
        console.log(`⚠️ Unknown registration cycle event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Registration cycle webhook processing error:', error);
    next(error);
  }
});

// Helper functions for webhook processing
async function handlePaymentAuthorized(data: any): Promise<void> {
  try {
    const { paymentId, authorizationCode, expiresAt } = data;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) return;

    // Update payment with authorization details
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'authorized',
      authorizationDetails: {
        authorizationCode,
        authorizedAt: new Date(),
        expiresAt: new Date(expiresAt)
      }
    });

    // Update transaction
    await Transaction.findOneAndUpdate(
      { paymentId, type: 'authorization' },
      {
        status: 'success',
        externalTransactionId: authorizationCode,
        processedAt: new Date(),
        gatewayResponse: data
      }
    );

    // Send notification
    await NotificationService.notifyPaymentAuthorized(paymentId);
  } catch (error) {
    console.error('❌ Error handling payment authorized:', error);
  }
}

async function handlePaymentCaptured(data: any): Promise<void> {
  try {
    const { paymentId, captureCode, transactionId } = data;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) return;

    // Update payment with capture details
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'captured',
      captureDetails: {
        captureCode,
        capturedAt: new Date(),
        transactionId
      }
    });

    // Update transaction
    await Transaction.findOneAndUpdate(
      { paymentId, type: 'capture' },
      {
        status: 'success',
        externalTransactionId: transactionId,
        processedAt: new Date(),
        gatewayResponse: data
      }
    );

    // Send notification
    await NotificationService.notifyPaymentCaptured(paymentId);
  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(data: any): Promise<void> {
  try {
    const { paymentId, reason } = data;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) return;

    // Update payment status
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'failed',
      failureReason: reason
    });

    // Update transaction
    await Transaction.findOneAndUpdate(
      { paymentId, type: 'authorization' },
      {
        status: 'failed',
        failureReason: reason,
        processedAt: new Date(),
        gatewayResponse: data
      }
    );

    // Send notification
    await NotificationService.notifyPaymentFailed(paymentId, reason);
  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
}

async function handlePaymentRefunded(data: any): Promise<void> {
  try {
    const { paymentId, refundCode, refundAmount, reason } = data;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) return;

    // Update payment with refund details
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'refunded',
      refundDetails: {
        refundReference: refundCode,
        refundedAt: new Date(),
        refundAmount,
        reason
      }
    });

    // Update transaction
    await Transaction.findOneAndUpdate(
      { paymentId, type: 'refund' },
      {
        status: 'success',
        externalTransactionId: refundCode,
        processedAt: new Date(),
        gatewayResponse: data
      }
    );

    // Send notification
    await NotificationService.notifyPaymentRefunded(paymentId);
  } catch (error) {
    console.error('❌ Error handling payment refunded:', error);
  }
}

async function handleIncomingWhatsAppMessage(message: any): Promise<void> {
  try {
    const { from, text } = message.body;
    
    console.log(`📱 Incoming WhatsApp message from ${from}: ${text.body}`);
    
    // In a real implementation, this would:
    // 1. Parse the message content
    // 2. Identify the student by phone number
    // 3. Process commands (e.g., "check status", "help", etc.)
    // 4. Send appropriate responses
    
    // For now, just log the message
    console.log(`✅ WhatsApp message processed from ${from}`);
  } catch (error) {
    console.error('❌ Error handling incoming WhatsApp message:', error);
  }
}

export default router;

