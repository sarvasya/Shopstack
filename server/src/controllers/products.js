const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=price|-price|-createdAt&page=1&limit=12
exports.list = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort = '-createdAt' } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort.split(',').join(' ')).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, page, pages: Math.ceil(total / limit), total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await Product.create(req.body));
});

exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
});
