// npm run seed  -> creates an admin, a demo user and sample products
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Product.deleteMany({})]);
  await User.create([
    { name: 'Admin', email: 'admin@shop.dev', password: 'admin123', role: 'admin' },
    { name: 'Demo User', email: 'user@shop.dev', password: 'user123' },
  ]);
  await Product.insertMany([
    { name: 'Mechanical Keyboard', description: 'Hot-swappable, tactile switches', price: 3499, stock: 25, category: 'electronics' },
    { name: 'Wireless Mouse', description: 'Ergonomic, 2.4GHz', price: 899, stock: 60, category: 'electronics' },
    { name: 'Notebook (A5)', description: 'Dot grid, 120 pages', price: 199, stock: 200, category: 'stationery' },
    { name: 'Desk Lamp', description: 'Adjustable warm/cool light', price: 1299, stock: 40, category: 'home' },
    { name: 'Backpack 25L', description: 'Water-resistant laptop bag', price: 1799, stock: 30, category: 'accessories' },
    { name: 'USB-C Hub', description: '6-in-1 with HDMI', price: 1599, stock: 5, category: 'electronics' },
  ]);
  console.log('Seeded. admin@shop.dev / admin123  |  user@shop.dev / user123');
  process.exit(0);
})();
