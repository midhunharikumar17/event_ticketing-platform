const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
  bookingRef:     { type: String, unique: true, default: () => 'TV' + uuidv4().replace(/-/g,'').slice(0,10).toUpperCase() },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  tierName:       { type: String, required: true },
  quantity:       { type: Number, required: true, min: 1 },
  status:         { type: String, enum: ['pending','confirmed','cancelled','refunded'], default: 'confirmed' },
  totalAmount:    { type: Number, required: true },
  paymentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  groupSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupSession', default: null },
  confirmedAt:    { type: Date, default: () => new Date() },
}, { timestamps: true });

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
// const mongoose = require('mongoose');

// const bookingItemSchema = new mongoose.Schema({
//   seatId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
//   tierId:         { type: mongoose.Schema.Types.ObjectId, required: true },
//   priceAtBooking: { type: Number, required: true },
// });

// const bookingSchema = new mongoose.Schema({
//   userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   eventId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
//   status:         { type: String, enum: ['pending','confirmed','cancelled','refunded'], default: 'pending' },
//   items:          [bookingItemSchema],
//   totalAmount:    { type: Number, required: true },
//   paymentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
//   groupSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupSession', default: null },
//   confirmedAt:    { type: Date, default: null },
// }, { timestamps: true });

// bookingSchema.index({ userId: 1, status: 1 });
// bookingSchema.index({ eventId: 1, status: 1 });
// bookingSchema.index({ paymentId: 1 });

// module.exports = mongoose.model('Booking', bookingSchema);
