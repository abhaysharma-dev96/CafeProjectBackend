import jwt from 'jsonwebtoken';

// Verifies the httpOnly cookie and attaches the user's role to the request.
export const requireAuth = (allowedRoles) => (req, res, next) => {
  const token = req.cookies?.bh_token;
  if (!token) {
    return res.status(401).json({ message: 'Not logged in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'You do not have access to this.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};
