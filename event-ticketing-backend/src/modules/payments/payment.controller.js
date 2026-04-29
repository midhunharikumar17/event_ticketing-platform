const paymentService = require('./payment.service');
const crypto         = require('crypto');

async function createOrder(req, res, next) {
  try {
    const { bookingId } = req.body;
    const result = await paymentService.createOrder(req.user.id, bookingId);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// Called from frontend after Razorpay success handler fires
async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body   = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Confirm the booking
    const Booking = require('../bookings/booking.model');
    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === 'pending') {
      booking.status      = 'confirmed';
      booking.confirmedAt = new Date();
      await booking.save();
    }

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) { next(err); }
}

async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    await paymentService.handleWebhook(req.rawBody, signature);
    res.sendStatus(200);
  } catch (err) {
    if (err.code === 'INVALID_SIGNATURE') return res.sendStatus(400);
    next(err);
  }
}

async function getPaymentByBooking(req, res, next) {
  try {
    const payment = await paymentService.getPaymentByBooking(
      req.params.bookingId, req.user.id, req.user.role
    );
    res.json({ payment });
  } catch (err) { next(err); }
}

module.exports = { createOrder, verifyPayment, handleWebhook, getPaymentByBooking };