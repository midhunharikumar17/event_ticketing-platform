const service = require('./user.service');

async function getMe(req, res, next) {
  try {
    const user = await service.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await service.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await service.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const result = await service.listUsers(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const result = await service.deactivateUser(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, changePassword, listUsers, deactivateUser };