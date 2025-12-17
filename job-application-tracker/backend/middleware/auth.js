
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ success: false, msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded token:", decoded);

    if (decoded.user && decoded.user.id) {
      req.user = decoded.user;
    } else if (decoded.userId) {
      req.user = { id: decoded.userId };
    } else {
      return res.status(401).json({ success: false, msg: 'Invalid token structure' });
    }

    next();
  } catch (err) {
    console.error('❌ Token decode failed:', err.message);
    res.status(401).json({ success: false, msg: 'Token is not valid' });
  }
};

module.exports = auth;
