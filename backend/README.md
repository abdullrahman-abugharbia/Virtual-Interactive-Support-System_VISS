# React E-Commerce Backend (Node.js + Express + PostgreSQL)

Production-style backend for your React e-commerce frontend.

## Stack
- Node.js + Express.js
- PostgreSQL (`pg` driver)
- JWT auth (cookie + bearer token support)
- Role-based access control (`admin`, `user`)
- Validation with `zod`
- Stripe PaymentIntent endpoint (`/create-payment-intent`)
- Structured layers: `controllers`, `routes`, `models`, `middlewares`, `config`, `services`, `utils`

## Folder Structure

```txt
backend/
  src/
    config/
    controllers/
    database/
      migrations/
      seeds/
    middlewares/
    models/
    routes/
    scripts/
    services/
    utils/
    validators/
    app.js
    server.js
  .env.example
  package.json
```

## Database Schema
Main tables and relationships:
- `users`
- `categories`
- `products` -> `categories`
- `carts` -> `users`
- `cart_items` -> `carts`, `products`
- `orders` -> `users`
- `order_items` -> `orders`, `products`

Schema is defined in:
- `src/database/migrations/001_init.sql`

Seed data is defined in:
- `src/database/seeds/001_seed.sql`

## Run Locally

1. Install dependencies
```bash
cd backend
npm install
```

2. Create environment file
```bash
cp .env.example .env
```

3. Create database in PostgreSQL (example)
```sql
CREATE DATABASE react_ecommerce;
```

4. Run migrations
```bash
npm run db:migrate
```

5. Seed sample data
```bash
npm run db:seed
```

6. Start backend
```bash
npm run dev
```

API runs by default on:
- `http://localhost:8080`

Health check:
- `GET /health`

## Frontend Compatibility
This backend supports your existing frontend endpoints directly:
- `/auth/*`
- `/products`
- `/brands`
- `/categories`
- `/cart`
- `/orders`
- `/users/own`

It also exposes versioned routes via:
- `/api/v1/*`

## Default Seed Users
- Admin: `admin@example.com` / `Admin@123`
- Customer: `customer@example.com` / `User@1234`

## Core API Endpoints

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/check`
- `GET /auth/logout`
- `POST /auth/reset-password-request`
- `POST /auth/reset-password`

### Products
- `GET /products`
- `GET /products/:id`
- `POST /products` (admin)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin, soft delete)
- `GET /brands`

### Categories
- `GET /categories`
- `GET /categories/:id`
- `POST /categories` (admin)
- `PATCH /categories/:id` (admin)
- `DELETE /categories/:id` (admin)

### Cart
- `GET /cart`
- `POST /cart`
- `PATCH /cart/:id`
- `DELETE /cart/:id`

### Orders
- `POST /orders` (create from current user cart)
- `GET /orders/own`
- `GET /orders/:id` (owner/admin)
- `GET /orders` (admin)
- `PATCH /orders/:id` (admin)

### Payments
- `POST /create-payment-intent`

### Admin Dashboard Support
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/orders`
- `PATCH /admin/orders/:id`

## Notes
- Passwords are hashed using `bcrypt`.
- Auth token is stored in an HTTP-only cookie (`token` by default).
- Sorting/pagination compatible with frontend query params: `_sort`, `_order`, `_page`, `_limit`.
- For card payments, set `STRIPE_SECRET_KEY` in `.env`.
