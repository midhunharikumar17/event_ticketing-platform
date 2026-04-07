const mongoose = require('mongoose');

const resaleListingSchema = new mongoose.Schema({
  ticketId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, unique: true },
  sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  seatId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  resalePrice:   { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  status:        { type: String, enum: ['active','sold','cancelled'], default: 'active' },
  soldAt:        { type: Date, default: null },
  buyerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Enforce 20% price cap at schema level
resaleListingSchema.pre('save', function (next) {
  if (this.resalePrice > this.originalPrice * 1.2) {
    const err = new Error('Resale price exceeds the maximum allowed 20% above face value');
    err.status = 400;
    err.code = 'RESALE_PRICE_EXCEEDS_CAP';
    return next(err);
  }
  next();
});

resaleListingSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('ResaleListing', resaleListingSchema);
