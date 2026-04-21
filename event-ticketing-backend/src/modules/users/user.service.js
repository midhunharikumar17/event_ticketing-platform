const User = require('./user.model');

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

async function updateProfile(userId, updates) {
  // Only allow safe fields
  const allowed = ['displayName', 'bio', 'avatarUrl', 'interests'];
  const filtered = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  });
  // Also accept 'name' from frontend and map it to displayName
  if (updates.name !== undefined) filtered.displayName = updates.name;
  if (updates.phone !== undefined) filtered.phone = updates.phone;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: filtered },
    { new: true, runValidators: true }
  );
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.status = 400;
    throw err;
  }

  user.passwordHash = newPassword; // pre-save hook will hash it
  await user.save();
  return { message: 'Password changed successfully' };
}

async function listUsers({ page = 1, limit = 20, role, search } = {}) {
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email:       { $regex: search, $options: 'i' } },
    ];
  }

  const skip  = (page - 1) * limit;
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  return { users, total, page: Number(page), limit: Number(limit) };
}

async function deactivateUser(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { message: 'User removed' };
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  deactivateUser,
};