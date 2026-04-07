const bookingService = require('./booking.service');

async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.sub, req.body);
    res.status(201).json({ booking });
  } catch (err) { next(err); }
}

async function getBooking(req, res, next) {
  try {
    const booking = await bookingService.getBooking(
      req.params.id, req.user.sub, req.user.role
    );
    res.json({ booking });
  } catch (err) { next(err); }
}

async function getUserBookings(req, res, next) {
  try {
    const bookings = await bookingService.getUserBookings(req.user.sub);
    res.json({ bookings });
  } catch (err) { next(err); }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id, req.user.sub, req.user.role
    );
    res.json({ message: 'Booking cancelled', booking });
  } catch (err) { next(err); }
}

module.exports = { createBooking, getBooking, getUserBookings, cancelBooking };