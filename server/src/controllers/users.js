const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => res.json(await User.find().sort('-createdAt')));

exports.setRole = asyncHandler(async (req, res) => {
  if (!['user', 'admin'].includes(req.body.role)) throw new ApiError(400, 'Role must be user or admin');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
});
