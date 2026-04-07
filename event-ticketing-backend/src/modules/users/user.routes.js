const router = require('express').Router();
// Phase 2 — user profile and social routes come here
router.get('/me', require('../../middleware/authenticate'), (req, res) => {
  res.json({ user: req.user });
});
module.exports = router;
