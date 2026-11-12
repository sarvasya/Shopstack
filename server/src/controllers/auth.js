const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const send = (res, status, user) =>
  res.status(status).json({
    token: sign(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // role is never taken from the body: prevents self-promotion to admin.
  const user = await User.create({ name, email, password });
  send(res, 201, user);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  send(res, 200, user);
});

exports.me = (req, res) => res.json({ user: req.user });
