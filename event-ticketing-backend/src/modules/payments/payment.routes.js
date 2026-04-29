const express      = require('express');
const router       = express.Router();
const controller   = require('./payment.controller');
const authenticate = require('../../middleware/authenticate');

router.post('/webhook', (req, res, next) => {
  req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
  controller.handleWebhook(req, res, next);
});

router.post('/create-order',        authenticate, controller.createOrder);
router.post('/verify',              authenticate, controller.verifyPayment);
router.get('/booking/:bookingId',   authenticate, controller.getPaymentByBooking);

module.exports = router;