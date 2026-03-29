// ===== JWT TOKEN SETUP =====
const jwt = require('jsonwebtoken');

const JWT_SECRET = "gowtham-murali";

// ===== MIDDLEWARE FUNCTION =====

// Check if request has valid token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Decode and verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ===== TOKEN FUNCTION =====

// Create JWT token for user
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// ===== EXPORTS =====
module.exports = { verifyToken, generateToken, JWT_SECRET };
