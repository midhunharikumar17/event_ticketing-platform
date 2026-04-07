const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  price:             { type: Number, required: true, min: 0 },
  totalQuantity:     { type: Number, required: true, min: 1 },
  remainingQuantity: { type: Number, required: true },
  description:       { type: String, default: '' },
});

const seatSectionSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  tierId:       { type: mongoose.Schema.Types.ObjectId },
  rowCount:     { type: Number, required: true },
  seatsPerRow:  { type: Number, required: true },
  layoutConfig: { type: mongoose.Schema.Types.Mixed, default: null },
});

const eventSchema = new mongoose.Schema({
  organizerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  category:     { type: String, required: true },
  venueName:    { type: String, required: true },
  venueAddress: { type: String, required: true },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  startTime:    { type: Date, required: true },
  endTime:      { type: Date, required: true },
  posterUrl:    { type: String, default: null },
  status:       { type: String, enum: ['draft','published','cancelled','completed'], default: 'draft' },
  maxCapacity:  { type: Number, required: true },
  tiers:        [ticketTierSchema],
  sections:     [seatSectionSchema],
}, { timestamps: true });

eventSchema.index({ status: 1, startTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ location: '2dsphere' });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
