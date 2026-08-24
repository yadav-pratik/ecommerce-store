import type { Order } from '../models/order';

/**
 * In-memory order storage — same shape as the other stores: one Map owned
 * by this module, plain functions to read and write it, no class.
 *
 * `findAllOrders` gets added later, exactly when admin stats (Stage 12)
 * need it — not ahead of time.
 */
let orders = new Map<string, Order>();

export function saveOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

/**
 * Needed starting Stage 7's tests, to directly verify that a failed
 * checkout creates no order — and reused from Stage 8 on for discount
 * eligibility, which counts completed orders.
 */
export function countOrders(): number {
  return orders.size;
}

/** Test-only helper — clears every order back to an empty store. */
export function resetOrderStore(): void {
  orders = new Map();
}
