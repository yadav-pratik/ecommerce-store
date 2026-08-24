import type { Order } from '../models/order';

/**
 * In-memory order storage — same shape as the other stores: one Map owned
 * by this module, plain functions to read and write it, no class.
 *
 * Only `saveOrder` is needed for Stage 6 (checkout). Functions like
 * "count all orders" or "list every order" are added later, in whichever
 * stage actually needs them (discount eligibility, admin stats) — not
 * ahead of time.
 */
let orders = new Map<string, Order>();

export function saveOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

/** Test-only helper — clears every order back to an empty store. */
export function resetOrderStore(): void {
  orders = new Map();
}
