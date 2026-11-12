const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth');
const auth = require('../controllers/auth');
const products = require('../controllers/products');
const cart = require('../controllers/cart');
const orders = require('../controllers/orders');
const users = require('../controllers/users');

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.me);

// Products (public read, admin write)
router.get('/products', products.list);
router.get('/products/:id', products.getOne);
router.post('/products', protect, restrictTo('admin'), products.create);
router.put('/products/:id', protect, restrictTo('admin'), products.update);
router.delete('/products/:id', protect, restrictTo('admin'), products.remove);

// Cart (all routes need a logged-in user)
router.use('/cart', protect);
router.get('/cart', cart.get);
router.post('/cart/items', cart.addItem);
router.put('/cart/items/:productId', cart.updateItem);
router.delete('/cart/items/:productId', cart.removeItem);
router.delete('/cart', cart.clear);

// Orders
router.post('/orders', protect, orders.create);
router.get('/orders/mine', protect, orders.mine);
router.get('/orders', protect, restrictTo('admin'), orders.all);
router.get('/orders/:id', protect, orders.getOne);
router.put('/orders/:id/cancel', protect, orders.cancel);
router.put('/orders/:id/status', protect, restrictTo('admin'), orders.updateStatus);

// Users (admin)
router.get('/users', protect, restrictTo('admin'), users.list);
router.put('/users/:id/role', protect, restrictTo('admin'), users.setRole);

module.exports = router;
