const express      = require('express');
const router       = express.Router();
const controller   = require('./payment.controller');
const authenticate = require('../../middleware/authenticate');

// Capture raw body for webhook signature verification ONLY on this route
// Must be registered BEFORE express.json() parses it
function rawBodyMiddleware(req, res, next) {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => { data += chunk; });
  req.on('end',  () => { req.rawBody = data; next(); });
}

// Webhook — NO authenticate middleware, Razorpay calls this directly
router.post('/webhook', rawBodyMiddleware, controller.handleWebhook);

// Authenticated routes
router.post('/create-order',             authenticate, controller.createOrder);
router.get('/booking/:bookingId',        authenticate, controller.getPaymentByBooking);

module.exports = router;