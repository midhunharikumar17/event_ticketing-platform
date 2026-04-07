const paymentService = require('./payment.service');

async function createOrder(req, res, next) {
  try {
    const { bookingId } = req.body;
    const result = await paymentService.createOrder(req.user.sub, bookingId);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function handleWebhook(req, res, next) {
  try {
    // req.rawBody is set by the raw body middleware on this route (see routes file)
    const signature = req.headers['x-razorpay-signature'];
    await paymentService.handleWebhook(req.rawBody, signature);
    // Always respond 200 fast — Razorpay will retry if it doesn't get a quick response
    res.sendStatus(200);
  } catch (err) {
    if (err.code === 'INVALID_SIGNATURE') return res.sendStatus(400);
    next(err);
  }
}

async function getPaymentByBooking(req, res, next) {
  try {
    const payment = await paymentService.getPaymentByBooking(
      req.params.bookingId, req.user.sub, req.user.role
    );
    res.json({ payment });
  } catch (err) { next(err); }
}

module.exports = { createOrder, handleWebhook, getPaymentByBooking };