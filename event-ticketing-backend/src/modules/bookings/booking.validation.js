const Joi = require('joi');
const objectId = Joi.string().pattern(/^[a-f\d]{24}$/i).message('must be a valid ObjectId');

const createBookingSchema = Joi.object({
  eventId:        objectId.required(),
  seatIds:        Joi.array().items(objectId).min(1).max(10).required(),
  groupSessionId: objectId.allow(null, ''),
}).options({ stripUnknown: true });

module.exports = { createBookingSchema };