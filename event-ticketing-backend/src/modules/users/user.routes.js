const router       = require('express').Router();
const controller   = require('./user.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);

router.get('/me',            controller.getMe);
router.patch('/me',          controller.updateMe);
router.patch('/me/password', controller.changePassword);

// Admin only
router.get('/',              authorize('admin'), controller.listUsers);
router.delete('/:id',        authorize('admin'), controller.deactivateUser);

module.exports = router;