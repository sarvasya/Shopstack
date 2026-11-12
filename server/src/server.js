require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

connectDB()
  .then(() => app.listen(process.env.PORT || 5000, () => console.log(`API on :${process.env.PORT || 5000}`)))
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
