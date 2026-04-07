const mongoose       = require('mongoose');
const crypto         = require('crypto');
const razorpay       = require('../../config/razorpay');
const Payment        = require('./payment.model');
const Booking        = require('../bookings/booking.model');
const bookingService = require('../bookings/booking.service');
const { getIO }      = require('../../config/socketServer');

// ─── Create Razorpay order ───────────────────────────────────────────────────

async function createOrder(userId, bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404; err.code = 'BOOKING_NOT_FOUND';
    throw err;
  }
  if (booking.userId.toString() !== userId.toString()) {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  if (booking.status !== 'pending') {
    const err = new Error('Booking is no longer awaiting payment');
    err.status = 400; err.code = 'BOOKING_NOT_PENDING';
    throw err;
  }

  // Check if a payment order already exists for this booking
  const existing = await Payment.findOne({
    bookingId,
    status: { $in: ['pending', 'completed'] },
  });
  if (existing?.status === 'completed') {
    const err = new Error('Booking is already paid');
    err.status = 400; err.code = 'ALREADY_PAID';
    throw err;
  }
  if (existing?.status === 'pending') {
    // Resume existing order — don't create a duplicate in Razorpay
    return { payment: existing, razorpayOrderId: existing.razorpayOrderId };
  }

  // Amount must be in paise (INR × 100)
  const amountInPaise = Math.round(booking.totalAmount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount:   amountInPaise,
    currency: 'INR',
    receipt:  bookingId.toString(),
    notes: {
      bookingId: bookingId.toString(),
      userId:    userId.toString(),
    },
  });

  const payment = await Payment.create({
    bookingId,
    userId,
    amount:          amountInPaise,
    currency:        'INR',
    status:          'pending',
    razorpayOrderId: razorpayOrder.id,
  });

  return { payment, razorpayOrderId: razorpayOrder.id };
}

// ─── Handle Razorpay webhook ─────────────────────────────────────────────────

async function handleWebhook(rawBody, signature) {
  // 1. Verify HMAC-SHA256 signature before touching the DB
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    const err = new Error('Invalid webhook signature');
    err.status = 400; err.code = 'INVALID_SIGNATURE';
    throw err;
  }

  const event = JSON.parse(rawBody);

  // 2. Only process successful payment captures
  if (event.event !== 'payment.captured') return { ignored: true };

  const {
    order_id:  razorpayOrderId,
    id:        razorpayPaymentId,
    signature: paymentSignature,
  } = event.payload.payment.entity;

  // 3. Look up our payment record
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    console.warn(`[webhook] payment.captured for unknown order: ${razorpayOrderId}`);
    return { ignored: true };
  }

  // 4. Idempotency guard — Razorpay retries webhooks on non-200 responses
  if (payment.status === 'completed') return { ignored: true };

  // 5. Fetch booking now so we have eventId and userId for socket emit
  const booking = await Booking.findById(payment.bookingId)
    .select('eventId userId items');
  if (!booking) {
    console.error(`[webhook] booking not found for payment: ${payment._id}`);
    return { ignored: true };
  }

  // 6. MongoDB transaction — Payment + Booking + Seats confirmed atomically
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Confirm booking (sets booking status → confirmed, seats → booked)
      await bookingService.confirmBooking(payment.bookingId, payment._id, session);

      // Complete the payment record
      payment.status            = 'completed';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = paymentSignature || null;
      payment.completedAt       = new Date();
      await payment.save({ session });
    });
  } catch (err) {
    // Mark payment as failed so it can be retried or investigated
    await Payment.findByIdAndUpdate(payment._id, {
      status:        'failed',
      failureReason: err.message,
    });
    throw err;
  } finally {
    await session.endSession();
  }

  // 7. Emit Socket.IO events AFTER transaction commits
  try {
    const io = getIO();

    // Broadcast seat status change to everyone on this event's seat map
    io.to(`event:${booking.eventId}`).emit('seats:updated', {
      seats: booking.items.map(item => ({
        seatId: item.seatId,
        status: 'booked',
      })),
    });

    // Notify the buyer personally
    io.to(`user:${booking.userId}`).emit('booking:confirmed', {
      bookingId: payment.bookingId,
      eventId:   booking.eventId,
    });
  } catch (socketErr) {
    // Never let a socket error fail the webhook response
    // Transaction already committed — booking is confirmed regardless
    console.error('[webhook] socket emit failed:', socketErr.message);
  }

  return { success: true, paymentId: payment._id };
}

// ─── Get payment by booking ──────────────────────────────────────────────────

async function getPaymentByBooking(bookingId, requesterId, requesterRole) {
  const payment = await Payment.findOne({ bookingId });
  if (!payment) {
    const err = new Error('Payment not found');
    err.status = 404; err.code = 'PAYMENT_NOT_FOUND';
    throw err;
  }
  const isOwner = payment.userId.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  return payment;
}

module.exports = { createOrder, handleWebhook, getPaymentByBooking };