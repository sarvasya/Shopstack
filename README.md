# ShopStack — E-commerce REST API + React Client

Full-stack MERN application built during my Software Development Internship at TechnoHacks Solutions.
REST APIs for **users, products, cart and orders**, secured with **JWT authentication** and Express middleware,
backed by **MongoDB** and consumed by a **React.js** frontend.

## Features
- **Auth**: register / login, bcrypt password hashing, JWT (Bearer) tokens, `GET /auth/me` session restore
- **Protected routes**: `protect` middleware (verifies JWT) and `restrictTo('admin')` (role-based access)
- **Products**: CRUD (admin write), public listing with search, category filter, price range, sorting, pagination
- **Cart**: add / update / remove / clear, stock validation, computed totals with populated products
- **Orders**: checkout from cart, price snapshot, atomic stock decrement with rollback, cancel (restocks), admin status updates
- **Hardening**: helmet, CORS allow-list, rate limiting on auth, central error handler, role can't be set at signup
- **React client**: login/register, shop with filters, cart, order history, admin dashboard, route guards

## Tech stack
React 18 · Vite · React Router · Node.js · Express · MongoDB · Mongoose · JWT · bcryptjs

## Getting started
Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI).

```bash
# 1. API
cd server
cp .env.example .env        # set JWT_SECRET and MONGO_URI
npm install
npm run seed                # optional: admin@shop.dev / admin123, user@shop.dev / user123
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

## API reference
All routes are prefixed with `/api`. 🔒 = needs `Authorization: Bearer <token>`, 👑 = admin only.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account, returns `{ token, user }` |
| POST | `/auth/login` | Log in, returns `{ token, user }` |
| GET | `/auth/me` 🔒 | Current user |
| GET | `/products` | List. Query: `search, category, minPrice, maxPrice, sort, page, limit` |
| GET | `/products/:id` | Single product |
| POST / PUT / DELETE | `/products[/:id]` 🔒👑 | Create / update / delete product |
| GET | `/cart` 🔒 | Cart with items and total |
| POST | `/cart/items` 🔒 | `{ productId, quantity }` add item |
| PUT | `/cart/items/:productId` 🔒 | `{ quantity }` set quantity |
| DELETE | `/cart/items/:productId` 🔒 | Remove item |
| DELETE | `/cart` 🔒 | Clear cart |
| POST | `/orders` 🔒 | `{ shippingAddress }` checkout current cart |
| GET | `/orders/mine` 🔒 | My orders |
| GET | `/orders/:id` 🔒 | Order (owner or admin) |
| PUT | `/orders/:id/cancel` 🔒 | Cancel a pending order, restocks items |
| GET | `/orders` 🔒👑 | All orders (`?status=`) |
| PUT | `/orders/:id/status` 🔒👑 | `{ status }` pending/paid/shipped/delivered/cancelled |
| GET / PUT | `/users`, `/users/:id/role` 🔒👑 | List users / change role |

Errors always return `{ "message": "..." }` with a proper status code (400, 401, 403, 404, 409).

## Design decisions
- **JWT in the `Authorization` header** (stateless). Simple for an SPA; a production app should consider httpOnly cookies.
- **Orders snapshot name and price** so later product edits don't rewrite history.
- **Stock uses an atomic guard** (`findOneAndUpdate` with `stock >= qty`) to prevent overselling under concurrent checkouts; failures roll back earlier lines. MongoDB transactions would be the next step (needs a replica set).
- **Payments are out of scope**: `paid` is set manually by an admin. Stripe/Razorpay would be the next integration.

## Project structure
```
server/src
  config/ models/ controllers/ routes/ middleware/ utils/
  app.js  server.js  seed.js
client/src
  pages/ (Shop, Cart, Orders, Login, Admin)  api.js  auth.jsx  App.jsx
```

## Ideas to extend
Refresh tokens, email verification, product images via Cloudinary, Jest + Supertest tests, Docker Compose, payment gateway, Swagger docs.
