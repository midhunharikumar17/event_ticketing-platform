const Joi = require('joi');

const objectId = Joi.string().pattern(/^[a-f\d]{24}$/i).message('must be a valid ObjectId');

const createBookingSchema = Joi.object({
  // eventId:        objectId.required(),
  eventId:        Joi.string().required(),
  tierName:       Joi.string().required(),
  quantity:       Joi.number().integer().min(1).max(10).required(),
  seatIds:        Joi.array().items(objectId).default([]),
  groupSessionId: objectId.allow(null, ''),
}).options({ stripUnknown: true });

module.exports = { createBookingSchema };