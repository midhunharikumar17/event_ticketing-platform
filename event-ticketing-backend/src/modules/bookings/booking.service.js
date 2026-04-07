const mongoose      = require('mongoose');
const Booking       = require('./booking.model');
const Seat          = require('../seats/seat.model');
const Event         = require('../events/event.model');
const seatService   = require('../seats/seat.service');

// ─── Create booking (pending) ────────────────────────────────────────────────

async function createBooking(userId, { eventId, seatIds, groupSessionId }) {
  // 1. Validate event exists and is published
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404; err.code = 'EVENT_NOT_FOUND';
    throw err;
  }
  if (event.status !== 'published') {
    const err = new Error('Event is not available for booking');
    err.status = 400; err.code = 'EVENT_NOT_PUBLISHED';
    throw err;
  }

  // 2. Fetch seats and verify all are available
  const seats = await Seat.find({ _id: { $in: seatIds }, eventId });
  if (seats.length !== seatIds.length) {
    const err = new Error('One or more seats not found for this event');
    err.status = 400; err.code = 'SEATS_NOT_FOUND';
    throw err;
  }
  const unavailable = seats.filter(s => s.status !== 'available');
  if (unavailable.length) {
    const err = new Error('One or more seats are no longer available');
    err.status = 409; err.code = 'SEATS_UNAVAILABLE';
    err.seats = unavailable.map(s => s._id);
    throw err;
  }

  // 3. Acquire Redis locks via seat service
  const failedLocks = await seatService.lockSeats(seatIds, userId);
  if (failedLocks.length) {
    const err = new Error('One or more seats are being held by another user');
    err.status = 409; err.code = 'SEATS_LOCKED';
    err.seats = failedLocks;
    throw err;
  }

  // 4. Build booking items and compute total
  const items = seats.map(seat => ({
    seatId:         seat._id,
    tierId:         seat.tierId,
    priceAtBooking: seat.price,
  }));
  const totalAmount = items.reduce((sum, item) => sum + item.priceAtBooking, 0);

  // 5. Create pending booking
  try {
    const booking = await Booking.create({
      userId,
      eventId,
      status:         'pending',
      items,
      totalAmount,
      groupSessionId: groupSessionId || null,
    });
    return booking;
  } catch (err) {
    // DB write failed — release locks so seats aren't stuck
    await seatService.releaseSeats(seatIds);
    throw err;
  }
}

// ─── Confirm booking (called from payment webhook) ───────────────────────────

async function confirmBooking(bookingId, paymentId, session) {
  const booking = await Booking.findById(bookingId).session(session);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404; err.code = 'BOOKING_NOT_FOUND';
    throw err;
  }
  if (booking.status === 'confirmed') return booking; // idempotent
  if (booking.status !== 'pending') {
    const err = new Error('Booking cannot be confirmed');
    err.status = 400; err.code = 'BOOKING_NOT_PENDING';
    throw err;
  }

  const seatIds = booking.items.map(item => item.seatId);

  // Mark seats as booked in DB — inside the transaction
  await Seat.updateMany(
    { _id: { $in: seatIds } },
    { $set: { status: 'booked', bookingId } },
    { session }
  );

  // Confirm the booking
  booking.status      = 'confirmed';
  booking.paymentId   = paymentId;
  booking.confirmedAt = new Date();
  await booking.save({ session });

  // Release Redis locks — seats are now permanently booked in DB
  // This runs outside the transaction intentionally — Redis is not transactional
  await seatService.releaseSeats(seatIds);

  return booking;
}

// ─── Cancel booking ──────────────────────────────────────────────────────────

async function cancelBooking(bookingId, requesterId, requesterRole) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404; err.code = 'BOOKING_NOT_FOUND';
    throw err;
  }

  const isOwner = booking.userId.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    const err = new Error('Booking cannot be cancelled');
    err.status = 400; err.code = 'BOOKING_NOT_CANCELLABLE';
    throw err;
  }

  const seatIds = booking.items.map(item => item.seatId);

  // Release seats back to available in DB
  await Seat.updateMany(
    { _id: { $in: seatIds } },
    { $set: { status: 'available', bookingId: null } }
  );

  // Release any lingering Redis locks
  await seatService.releaseSeats(seatIds);

  booking.status = 'cancelled';
  await booking.save();
  return booking;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

async function getUserBookings(userId) {
  return Booking.find({ userId, status: { $ne: 'cancelled' } })
    .populate('eventId', 'title startTime venueName posterUrl')
    .sort({ createdAt: -1 });
}

async function getBooking(bookingId, requesterId, requesterRole) {
  const booking = await Booking.findById(bookingId)
    .populate('eventId', 'title startTime venueName')
    .populate('userId',  'displayName email');
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404; err.code = 'BOOKING_NOT_FOUND';
    throw err;
  }
  const isOwner = booking.userId._id.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  return booking;
}

module.exports = {
  createBooking, confirmBooking, cancelBooking,
  getUserBookings, getBooking,
};