const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, 'yourefde70f51cef4b21eb4ded0230aa5f4099d4cb2e403e413341a920375032309129b62e86a7b7c5391692bf27cf58c2e39af1e44be11682ac42eab673a525d569'); // Replace with your secret key
    req.userId = decoded.id; // Attach user ID to the request object
    req.username = decoded.username; // Attach username to the request object
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token. Access denied.' });
  }
};

module.exports = authMiddleware;
