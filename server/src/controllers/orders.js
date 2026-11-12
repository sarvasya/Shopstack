const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/orders  { shippingAddress }  -> converts the user's cart into an order.
// Stock is decremented atomically per product (stock >= qty guard). If any line fails,
// previously decremented lines are rolled back (works on standalone MongoDB, no transactions needed).
exports.create = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress) throw new ApiError(400, 'Shipping address is required');

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const lines = (cart?.items || []).filter((i) => i.product);
  if (!lines.length) throw new ApiError(400, 'Cart is empty');

  const reserved = [];
  try {
    for (const { product, quantity } of lines) {
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (!updated) throw new ApiError(409, `Not enough stock for "${product.name}"`);
      reserved.push({ id: product._id, quantity });
    }
  } catch (err) {
    await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.quantity } })));
    throw err;
  }

  const items = lines.map(({ product, quantity }) => ({
    product: product._id,
    name: product.name,
    price: product.price,
    quantity,
  }));
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const order = await Order.create({ user: req.user._id, items, total, shippingAddress });
  cart.items = [];
  await cart.save();
  res.status(201).json(order);
});

exports.mine = asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort('-createdAt'));
});

exports.getOne = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'admin' && !order.user._id.equals(req.user._id)) throw new ApiError(403, 'Not your order');
  res.json(order);
});

// Customers may cancel only while the order is still pending; stock is returned.
exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'admin' && !order.user.equals(req.user._id)) throw new ApiError(403, 'Not your order');
  if (order.status !== 'pending') throw new ApiError(400, `Cannot cancel an order that is ${order.status}`);

  await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
  order.status = 'cancelled';
  await order.save();
  res.json(order);
});

// Admin
exports.all = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await Order.find(filter).populate('user', 'name email').sort('-createdAt'));
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  order.status = req.body.status;
  await order.save(); // runs enum validation
  res.json(order);
});
