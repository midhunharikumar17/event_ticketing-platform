const Event = require('./event.model');
const Seat = require('../seats/seat.model');

async function createEvent(organizerId, data) {
  const event = new Event({ organizerId, ...data });
  await event.save();
  return event;
}

async function getEvent(eventId) {
  const event = await Event.findById(eventId).populate('organizerId', 'displayName avatarUrl');
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404; err.code = 'EVENT_NOT_FOUND';
    throw err;
  }
  return event;
}

async function listEvents(filters = {}) {
  const query = { status: 'published' };

  if (filters.category) query.category = filters.category;
  if (filters.q) query.$text = { $search: filters.q };

  if (filters.lat && filters.lng && filters.radius) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(filters.lng), parseFloat(filters.lat)] },
        $maxDistance: parseFloat(filters.radius) * 1000,
      },
    };
  }

  if (filters.dateFrom || filters.dateTo) {
    query.startTime = {};
    if (filters.dateFrom) query.startTime.$gte = new Date(filters.dateFrom);
    if (filters.dateTo)   query.startTime.$lte = new Date(filters.dateTo);
  }

  const page  = Math.max(1, parseInt(filters.page)  || 1);
  const limit = Math.min(50, parseInt(filters.limit) || 12);
  const skip  = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('organizerId', 'displayName'),
    Event.countDocuments(query),
  ]);

  return { events, total, page, pages: Math.ceil(total / limit) };
}

async function updateEvent(eventId, organizerId, data) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404; err.code = 'EVENT_NOT_FOUND';
    throw err;
  }
  if (event.organizerId.toString() !== organizerId.toString()) {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  if (event.status !== 'draft') {
    const err = new Error('Only draft events can be edited');
    err.status = 400; err.code = 'EVENT_NOT_DRAFT';
    throw err;
  }
  Object.assign(event, data);
  await event.save();
  return event;
}

async function publishEvent(eventId, organizerId) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404; err.code = 'EVENT_NOT_FOUND';
    throw err;
  }
  if (event.organizerId.toString() !== organizerId.toString()) {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  if (event.status !== 'draft') {
    const err = new Error('Event is already published or cancelled');
    err.status = 400; err.code = 'EVENT_NOT_DRAFT';
    throw err;
  }

  await seedSeats(event);

  event.status = 'published';
  await event.save();
  return event;
}

async function cancelEvent(eventId, requesterId, requesterRole) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404; err.code = 'EVENT_NOT_FOUND';
    throw err;
  }
  const isOwner = event.organizerId.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403; err.code = 'FORBIDDEN';
    throw err;
  }
  event.status = 'cancelled';
  await event.save();
  return event;
}

async function getOrganizerEvents(organizerId) {
  return Event.find({ organizerId }).sort({ createdAt: -1 });
}

async function getAttendeeCount(eventId) {
  const Booking = require('../bookings/booking.model');
  return Booking.countDocuments({ eventId, status: 'confirmed' });
}

async function seedSeats(event) {
  const seats = [];
  for (const section of event.sections) {
    const tier = event.tiers.id(section.tierId);
    if (!tier) continue;
    for (let row = 0; row < section.rowCount; row++) {
      const rowLabel = String.fromCharCode(65 + row);
      for (let num = 1; num <= section.seatsPerRow; num++) {
        seats.push({
          eventId:     event._id,
          sectionId:   section._id,
          sectionName: section.name,
          tierId:      tier._id,
          price:       tier.price,
          rowLabel,
          seatNumber:  num,
          status:      'available',
        });
      }
    }
  }
  if (seats.length > 0) {
    await Seat.insertMany(seats, { ordered: false });
  }
  return seats.length;
}

module.exports = {
  createEvent, getEvent, listEvents, updateEvent,
  publishEvent, cancelEvent, getOrganizerEvents, getAttendeeCount,
};