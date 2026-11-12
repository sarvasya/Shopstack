const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const load = async (userId) => (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));

// Returns the cart with product details and a computed total.
const view = async (cart) => {
  await cart.populate('items.product');
  const items = cart.items.filter((i) => i.product); // drop items whose product was deleted
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return { items, total };
};

exports.get = asyncHandler(async (req, res) => res.json(await view(await load(req.user._id))));

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = parseInt(quantity);
  if (!productId || !(qty >= 1)) throw new ApiError(400, 'productId and a positive quantity are required');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const cart = await load(req.user._id);
  const existing = cart.items.find((i) => i.product.equals(productId));
  const newQty = (existing ? existing.quantity : 0) + qty;
  if (newQty > product.stock) throw new ApiError(400, `Only ${product.stock} in stock`);

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity: qty });
  await cart.save();
  res.json(await view(cart));
});

exports.updateItem = asyncHandler(async (req, res) => {
  const qty = parseInt(req.body.quantity);
  if (!(qty >= 1)) throw new ApiError(400, 'Quantity must be at least 1');

  const cart = await load(req.user._id);
  const item = cart.items.find((i) => i.product.equals(req.params.productId));
  if (!item) throw new ApiError(404, 'Item not in cart');

  const product = await Product.findById(req.params.productId);
  if (!product || qty > product.stock) throw new ApiError(400, `Only ${product ? product.stock : 0} in stock`);

  item.quantity = qty;
  await cart.save();
  res.json(await view(cart));
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await load(req.user._id);
  cart.items = cart.items.filter((i) => !i.product.equals(req.params.productId));
  await cart.save();
  res.json(await view(cart));
});

exports.clear = asyncHandler(async (req, res) => {
  const cart = await load(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ items: [], total: 0 });
});
