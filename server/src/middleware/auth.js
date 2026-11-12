const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the Bearer token and attaches the user to req.user.
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated: token missing');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Not authenticated: token invalid or expired');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  req.user = user;
  next();
});

// Role-based access control: restrictTo('admin')
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission'));
  next();
};
