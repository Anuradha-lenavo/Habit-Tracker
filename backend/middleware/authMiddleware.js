const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, 'YOUR JWT SECRET KEY'); // Replace with your secret key
    req.userId = decoded.id; // Attach user ID to the request object
    req.username = decoded.username; // Attach username to the request object
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token. Access denied.' });
  }
};

module.exports = authMiddleware;
