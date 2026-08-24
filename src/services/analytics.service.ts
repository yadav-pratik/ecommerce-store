import { findAllOrders } from '../stores/order.store';
import { findAllDiscountCodes } from '../stores/discount.store';

/**
 * Store-wide statistics for the admin endpoint. There is no
 * pending/cancelled order concept in this project — every saved order is
 * a completed one — so every order counts toward these totals.
 *
 * `revenue` is the amount actually paid (each order's `total`, already
 * net of its own discount) — not the sum of subtotals. `totalDiscountGiven`
 * is tracked separately, so `sum(subtotals) = revenue + totalDiscountGiven`
 * always reconciles (see IMPLEMENTATION_PLAN §9).
 */
export function getStoreStats() {
  const orders = findAllOrders();

  const totalItemsPurchased = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalDiscountGiven = orders.reduce((sum, order) => sum + order.discountAmount, 0);

  return {
    totalItemsPurchased,
    revenue,
    totalDiscountGiven,
    discountCodes: findAllDiscountCodes(),
  };
}
