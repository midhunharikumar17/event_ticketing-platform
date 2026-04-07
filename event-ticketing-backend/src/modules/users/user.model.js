const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String, required: true, trim: true },
  avatarUrl:    { type: String, default: null },
  bio:          { type: String, default: '' },
  role:         { type: String, enum: ['attendee', 'organizer', 'admin'], default: 'attendee' },
  isVerified:   { type: Boolean, default: false },
  interests:    [{ type: String }],
  following:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pushTokens:   [{ type: String }],
}, { timestamps: true });

userSchema.index({ role: 1 });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password helper
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never return passwordHash in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);