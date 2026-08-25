# Ecommerce Store API

Backend for an ecommerce store: add items to a cart, check out, and reward
customers with a discount code on every *n*th completed order.

See [DECISIONS.md](DECISIONS.md) for the reasoning behind the design
choices — in particular, why there isn't a class anywhere in this codebase.

## Stack

- Node.js (>=20.12) + TypeScript (strict)
- Express 5
- Vitest for tests
- Swagger UI (via `swagger-jsdoc`) for interactive API docs
- In-memory storage — no database, per the assignment

## Setup

```bash
npm install
```

## Running

```bash
npm run dev
```

Starts the server with auto-reload on `http://localhost:3000` (override
with the `PORT` environment variable, or a `.env` file — see
[Configuration](#configuration) below).

For a production-style run:

```bash
npm run build && npm start
```

## Tests

```bash
npm test
```

56 tests across 5 files, all targeting service functions directly (no
HTTP-layer tests — see `DECISIONS.md`).

## Type checking

```bash
npm run typecheck
```

## API docs

Once the server is running, open **`http://localhost:3000/docs`** for
interactive Swagger UI — every endpoint below can be tried directly from
the browser, including request bodies and example responses.

## Configuration

All optional; sensible defaults are used if unset.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `ORDER_INTERVAL` | `5` | Every *n*th completed order earns a discount-generation opportunity |
| `DISCOUNT_PERCENTAGE` | `10` | Percentage a generated discount code is worth |

Set these in a `.env` file (gitignored) or as real environment variables —
either works, since `.env` is loaded via Node's own `--env-file-if-exists`
flag, not a dependency.

## Product catalogue

Three products are seeded in memory (`src/config/products.ts`). Prices are
plain numbers with no currency symbol attached:

| id | name | price |
|---|---|---|
| `product-1` | Wireless Mouse | 799 |
| `product-2` | Mechanical Keyboard | 3499 |
| `product-3` | USB-C Hub | 1299 |

## API overview

Full request/response schemas are in Swagger (`/docs`); this is a quick
map of what exists.

```
GET  /health                            → { status: "ok" }

GET  /api/products                      → list the catalogue

POST /api/carts                         → create an empty cart
POST /api/carts/:cartId/items           → add a product (merges quantity if already present)
GET  /api/carts/:cartId                 → fetch a cart

POST /api/checkout                      → check out a cart, optionally with a discount code

GET  /api/admin/discounts/status        → see current discount eligibility
POST /api/admin/discounts               → generate one discount code, if eligible
GET  /api/admin/stats                   → store-wide statistics
```

Admin routes live under `/api/admin/*` but have no authentication — the
assignment doesn't define a user/auth concept, so none was added. See
`DECISIONS.md` for the reasoning; the namespace exists specifically so auth
could be added later without moving anything.

### A full walkthrough

```bash
# 1. See what's available
curl http://localhost:3000/api/products

# 2. Create a cart
curl -X POST http://localhost:3000/api/carts
# → { "id": "cart_...", "items": [], "createdAt": "..." }

# 3. Add items (adding the same productId again increases its quantity)
curl -X POST http://localhost:3000/api/carts/<cartId>/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"product-1","quantity":2}'

# 4. Check out (discountCode is optional)
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"cartId":"<cartId>"}'
# → the created order: subtotal, discountAmount (0 here), total, items
```

### The discount system, end to end

With the default config (`n=5`, `x=10`):

```bash
# After 5 completed checkouts (real ones, via /api/checkout):
curl http://localhost:3000/api/admin/discounts/status
# → { "completedOrders": 5, "orderInterval": 5, "discountPercentage": 10,
#     "codesGenerated": 0, "eligibleDiscounts": 1 }

curl -X POST http://localhost:3000/api/admin/discounts
# → { "code": "SAVE10-A1B2", "percentage": 10, "milestone": 1,
#     "used": false, "createdAt": "..." }

# Calling generate again right now → 409, nothing left to claim.
# Use the code at checkout:
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"cartId":"<cartId>","discountCode":"SAVE10-A1B2"}'
# → order.discountAmount = 10% of subtotal, order.total = subtotal - discountAmount

# The same code used again → 400 INVALID_DISCOUNT_CODE (single-use)
# The next eligibility appears at completed order #10, for milestone 2.
```

## Error shape

Every error response, from every endpoint, has the same shape:

```json
{ "error": { "code": "CART_EMPTY", "message": "Cannot checkout an empty cart" } }
```

| Status | When |
|---|---|
| `400` | Validation failure, empty cart, invalid/used discount code |
| `404` | Unknown cart or product |
| `409` | Generating a discount code when none is currently eligible |
| `500` | Unexpected server error |

## Project structure

```
src/
├── app.ts               # Express app factory — wires routes, no server binding
├── server.ts             # the only file that calls app.listen()
├── config/                # env-driven configuration (products seed, discount n/x)
├── models/                # plain TypeScript types — no classes
├── stores/                # in-memory state, one module per aggregate
├── services/              # business rules — plain functions, unit-tested directly
├── routes/                 # route tables with their handlers defined inline
├── middleware/             # errorHandler — turns thrown errors into JSON responses
├── errors/                 # createAppError() — a real Error with extra fields, not a class
└── docs/                   # Swagger UI wiring + shared OpenAPI component schemas

tests/                     # one file per service, calling service functions directly
```

There's no `controllers/` directory and no `container.ts` composition root —
both were tried and removed. See `DECISIONS.md` for why.

## Request flow

Every endpoint follows the same shape:

```
route → service → store
```

The route reads the request, calls one service function, and sends back
whatever it returns (or `middleware/errorHandler.ts` catches whatever it
throws). All the actual rules live in the service; the store just holds
the data.

Checkout is the one request that touches the most pieces, so it's the best
example of the full chain:

```
POST /api/checkout  { cartId, discountCode? }
  │
  ▼
checkout.service.ts
  │
  ├─▶ cart.service.ts        → look up the cart, confirm it's not empty
  ├─▶ product.store.ts       → resolve the real price of each item
  ├─▶ discount.service.ts    → validate the code (if one was sent) and work out the discount
  ├─▶ order.store.ts         → save the completed order
  └─▶ cart.store.ts          → empty the cart
  │
  ▼
201 Created — the order
```
