# Design Decisions

Decisions that shaped this codebase. Each one includes the trade-off, not
just the choice.

---

## Decision: TypeScript over JavaScript

**Context:** The project has several related entities — `Product`,
`Cart`/`CartItem`, `Order`/`OrderItem`, `DiscountCode` — passed between
stores, services, and routes. A `Cart` and an `Order` look similar enough
(both have an `id` and a list of items) that mixing them up wouldn't
necessarily show up as an obvious runtime error.

**Options Considered:**
- Option A: Plain JavaScript.
- Option B: TypeScript, strict mode, no advanced features (no decorators,
  no heavy generics).

**Choice:** Option B.

**Why:** Strict mode (plus `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`) catches things like a `Map.get()` that might
return `undefined` at compile time instead of in a test, or not at all. No
advanced TypeScript features were used — just enough to catch real
mistakes.

---

## Decision: Add a `/health` endpoint

**Context:** Nothing in the assignment asks for a liveness endpoint.

**Options Considered:**
- Option A: Skip it.
- Option B: Add a minimal `GET /health` returning `{ status: "ok" }`.

**Choice:** Option B.

**Why:** Costs almost nothing, and it's what every real backend has for a
basic uptime check. It was also the first thing built and verified, before
any real business logic existed. Placed at `/health`, not `/api/health`,
since it's about the process, not the business API.

---

## Decision: No signup/signin, no admin authentication or RBAC

**Context:** The assignment defines no customer, user, or role concept
anywhere.

**Options Considered:**
- Option A: Add minimal auth (an API key or JWT) to gate the admin routes.
- Option B: No authentication, but keep admin routes under their own
  `/api/admin/*` namespace.

**Choice:** Option B.

**Why:** Any auth here would be guessing at requirements the assignment
never gave — who the users are, how they log in. The `/api/admin/*`
namespace means real auth could be added later without moving anything.
Worth saying plainly: the admin endpoints are open to anyone right now.
That's accepted for this assignment's scope, not missed.

---

## Decision: Server owns every product price

**Context:** A cart needs to know what it costs. A client could send its
own price alongside `productId`/`quantity` — and lie about it.

**Options Considered:**
- Option A: Client sends the price; server trusts or spot-checks it.
- Option B: Client sends only `productId` + `quantity`. The server looks
  up the real price at checkout.

**Choice:** Option B.

**Why:** A client-supplied price is a "pay whatever you want" bug. `CartItem`
has no price field at all, so there's no path for a client-sent number to
affect a total.

---

## Decision: Orders store a price snapshot, not a live product reference

**Context:** Should an order's line items always show today's product
price, or what it cost at purchase time?

**Options Considered:**
- Option A: `OrderItem` stores `productId` and looks up the current price
  whenever it's read.
- Option B: `OrderItem` copies `name`/`unitPrice` at checkout and never
  looks at the product store again.

**Choice:** Option B.

**Why:** An order is a historical record. If a product's price changed
later, Option A would quietly rewrite history and skew stats like revenue.
This doesn't come up in practice yet (there's no product-editing API), but
it's the correct shape and cheap to build right the first time.

---

## Decision: Adding the same product to a cart merges quantity — in the store, not the service

**Context:** Adding product A ×2 then ×3 should give one line at quantity 5,
not two separate lines.

**Options Considered:**
- Option A: The service checks for an existing line and merges or pushes.
- Option B: The service only validates (cart/product exist, quantity is
  valid); the store's `addItemToCart` owns the merge-or-push itself.

**Choice:** Option B.

**Why:** Merging is about the cart's own data shape — no duplicate product
keys — and doesn't need anything outside the cart. "Does this product
exist" does need the product store, so that stays in the service. Each
piece only knows what it actually needs to.

---

## Decision: Empty or nonexistent carts cannot be checked out

**Context:** The assignment requires this exact rule, with its own test.

**Options Considered:**
- Option A: Allow checkout of an empty cart, producing a zero-item order.
- Option B: Reject with `400 CART_EMPTY` before any order is created.

**Choice:** Option B.

**Why:** An order with nothing in it would skew admin stats for no reason.
Tests confirm `countOrders()` stays `0` after a rejected attempt — the
function throws before it ever reaches the save step.

---

## Decision: Discount codes are single-use, global, and never expire

**Context:** The assignment doesn't say if a code can be reused, if it
belongs to a specific customer, or if it expires.

**Options Considered:**
- Reuse: allow repeat use, vs. mark used after one checkout and reject it
  after that.
- Ownership: tie a code to a customer, vs. make it global (anyone with the
  string can use it).
- Expiry: a time limit, vs. none.

**Choice:** Single-use, global, no expiry.

**Why:** Single-use is the normal meaning of "coupon code," and it's
tested directly. Global follows from there being no customer/account
concept anywhere else in this project. No expiry, since nothing in the
assignment asks for one — adding it would be inventing a requirement. All
three are assumptions, documented as such.

---

## Decision: Discount eligibility is earned every nth *completed* order, tracked by milestone

**Context:** "Every nth order gets a coupon" doesn't say what happens
between milestones, or how to stop the same milestone from producing two
coupons.

**Options Considered:**
- Option A: Every order from the nth onward stays eligible until a coupon
  is generated, then resets.
- Option B: `floor(completedOrders / n)` gives total eligibility earned;
  each is tied to a milestone number (order n → milestone 1, order 2n →
  milestone 2, …), claimed exactly once.

**Choice:** Option B.

**Why:** Option A makes "eligible" a fuzzy window that depends on timing.
Option B is an exact count:
`eligibleDiscounts = floor(completedOrders / n) - codesAlreadyGenerated`,
always the same answer no matter when you ask. A new code's milestone is
just `codesAlreadyGenerated + 1` — no separate bookkeeping of which
milestones are taken.

---

## Decision: Revenue means the amount actually paid, after discount

**Context:** The assignment asks for "revenue" without defining it.

**Options Considered:**
- Option A: `revenue = sum(subtotal)` — before any discount.
- Option B: `revenue = sum(total)` — after discount, with the discount
  total tracked separately.

**Choice:** Option B.

**Why:** Revenue should be money that actually came in. Option A would
overstate it by exactly what was given away. `sum(subtotal) = revenue +
totalDiscountGiven` always holds, and the tests check it directly.

---

## Decision: No explicit locking around coupon generation

**Context:** Two admin requests to generate a code could arrive close
together. Does generation need a lock?

**Options Considered:**
- Option A: Add a lock around the check-then-generate sequence.
- Option B: No lock.

**Choice:** Option B.

**Why:** Every store operation here is synchronous — there's no `await`
between checking eligibility and writing the new code, so one request
finishes before the next starts. To be precise: this is safe because this
specific operation has no async gap, **not** because "Node has no
concurrency." A multi-process or database-backed version would need real
coordination (transactions, atomic operations).

---

## Decision: Plain JavaScript `number` for money

**Context:** Floating-point math isn't exact (`0.1 + 0.2 !== 0.3`), a
classic source of money bugs.

**Options Considered:**
- Option A: Integer minor units (paise/cents).
- Option B: A decimal-math library (e.g. `decimal.js`).
- Option C: Plain `number`, with every discount amount explicitly rounded
  to 2 decimals (`Math.round(amount * 100) / 100`).

**Choice:** Option C.

**Why:** For a system this size, A and B are the right call in production,
but add real weight for a problem that doesn't need it here — seeded
prices are round numbers, and the rounding step handles the only decimals
that come up (percentage discounts). A conscious trade-off, not an
oversight.

---

## Decision: No HTTP-level tests — every test targets a service function directly

**Context:** "Unit tests for core business logic" could mean testing
through HTTP (`supertest`) or calling business logic functions directly.

**Options Considered:**
- Option A: `supertest` against the real Express app.
- Option B: Call service functions directly, check return values and
  thrown errors.

**Choice:** Option B.

**Why:** Every business rule lives in a service function; every route
handler just calls one and responds. Testing the service directly checks
the actual rule with less in the way. This is also why
`cartId`/`productId`/`quantity`/`discountCode` are typed `unknown` at each
service's boundary — the service has to be the thing that rejects bad
input, since nothing above it does.

---

## Decision: Swagger UI via `swagger-jsdoc`, instead of a frontend

**Context:** The assignment allows skipping a frontend if the API is easy
for a reviewer to explore and run.

**Options Considered:**
- Option A: A minimal frontend.
- Option B: Swagger UI from a hand-written OpenAPI spec file.
- Option C: Swagger UI from `@openapi` comments above each route handler.

**Choice:** Option C.

**Why:** A frontend costs more time for something the assignment treats as
optional. A separate spec file (B) drifts from the code over time; C keeps
the docs next to the handler they describe, making them easier to keep in
sync. Cost: nothing typechecks the comment's YAML, so `/docs` was checked
by hand after every stage that touched a route.
