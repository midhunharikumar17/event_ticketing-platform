const { verifyAccessToken } = require('../utils/jwtUtils');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'TOKEN_MISSING', message: 'No token provided' } });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Token is invalid or expired' } });
  }
}

module.exports = authenticate;
