const Booking = require('./booking.model');
const Event   = require('../events/event.model');

async function createBooking(userId, { eventId, tierName, quantity }) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found'); err.status = 404; throw err;
  }
  if (event.status !== 'published') {
    const err = new Error('Event is not available for booking'); err.status = 400; throw err;
  }

  const tier = event.tiers.find(t => t.name === tierName);
  if (!tier) {
    const err = new Error('Tier not found'); err.status = 400; throw err;
  }
  if (tier.remainingQuantity < quantity) {
    const err = new Error('Not enough tickets available'); err.status = 409; throw err;
  }

  // Decrement remaining quantity
  tier.remainingQuantity -= quantity;
  await event.save();

  const booking = await Booking.create({
    userId,
    eventId,
    tierName,
    quantity,
    totalAmount: tier.price * quantity,
    status: 'confirmed',
    confirmedAt: new Date(),
  });

  return booking;
}

async function getUserBookings(userId) {
  return Booking.find({ userId })
    .populate('eventId', 'title startTime venueName posterUrl category')
    .sort({ createdAt: -1 });
}

async function getBooking(bookingId, requesterId, requesterRole) {
  const booking = await Booking.findById(bookingId)
    .populate('eventId', 'title startTime venueName')
    .populate('userId', 'displayName email');
  if (!booking) {
    const err = new Error('Booking not found'); err.status = 404; throw err;
  }
  const isOwner = booking.userId._id.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== 'admin') {
    const err = new Error('Forbidden'); err.status = 403; throw err;
  }
  return booking;
}

async function cancelBooking(bookingId, requesterId, requesterRole) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found'); err.status = 404; throw err;
  }
  const isOwner = booking.userId.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== 'admin') {
    const err = new Error('Forbidden'); err.status = 403; throw err;
  }
  if (!['pending','confirmed'].includes(booking.status)) {
    const err = new Error('Booking cannot be cancelled'); err.status = 400; throw err;
  }

  // Restore ticket quantity
  const event = await Event.findById(booking.eventId);
  if (event) {
    const tier = event.tiers.find(t => t.name === booking.tierName);
    if (tier) { tier.remainingQuantity += booking.quantity; await event.save(); }
  }

  booking.status = 'cancelled';
  await booking.save();
  return booking;
}

async function getAllBookings() {
  return Booking.find()
    .populate('eventId', 'title startTime')
    .populate('userId', 'displayName email')
    .sort({ createdAt: -1 });
}

module.exports = { createBooking, getUserBookings, getBooking, cancelBooking, getAllBookings };