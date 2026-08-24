# Ecommerce Store API

Backend for an ecommerce store: add items to a cart, check out, and reward
customers with a discount code on every *n*th order.

Work in progress — the API surface is being built in stages. See
[DECISIONS.md](DECISIONS.md) once it lands for the reasoning behind the
design choices.

## Stack

- Node.js + TypeScript
- Express 5
- Vitest for tests
- In-memory storage (no database, per the assignment)

## Setup

```bash
npm install
```

## Running

```bash
npm run dev
```

Starts the server with auto-reload on `http://localhost:3000`
(override with `PORT`).

For a production-style run:

```bash
npm run build && npm start
```

## Tests

```bash
npm test
```

## Type checking

```bash
npm run typecheck
```
