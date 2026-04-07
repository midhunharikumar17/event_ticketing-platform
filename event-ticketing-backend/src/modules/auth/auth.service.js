const User = require('../users/user.model');
const RefreshToken = require('./auth.model');
const { signAccessToken, generateRefreshToken, hashToken } = require('../../utils/jwtUtils');

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

async function register({ displayName, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    err.code = 'EMAIL_IN_USE';
    throw err;
  }

  const user = new User({ displayName, email, passwordHash: password });
  await user.save(); // bcrypt pre-save hook fires here
  return user;
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const accessToken  = signAccessToken({ sub: user._id, email: user.email, role: user.role, displayName: user.displayName });
  const rawRefresh   = generateRefreshToken();
  const tokenHash    = hashToken(rawRefresh);
  const expiresAt    = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({ userId: user._id, tokenHash, expiresAt });

  return { user, accessToken, rawRefresh };
}

async function refresh(rawToken) {
  if (!rawToken) {
    const err = new Error('Refresh token missing');
    err.status = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash, revoked: false });

  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error('Refresh token invalid or expired');
    err.status = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  // Rotate: revoke old, issue new
  stored.revoked = true;
  await stored.save();

  const user = await User.findById(stored.userId);
  const accessToken = signAccessToken({ sub: user._id, email: user.email, role: user.role, displayName: user.displayName });
  const newRaw      = generateRefreshToken();
  const newHash     = hashToken(newRaw);
  const expiresAt   = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({ userId: user._id, tokenHash: newHash, expiresAt });

  return { accessToken, rawRefresh: newRaw };
}

async function logout(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.findOneAndDelete({ tokenHash });
}

module.exports = { register, login, refresh, logout };
