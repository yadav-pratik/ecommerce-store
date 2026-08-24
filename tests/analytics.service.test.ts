import { beforeEach, describe, expect, it } from 'vitest';
import { resetProductStore } from '../src/stores/product.store';
import { resetCartStore } from '../src/stores/cart.store';
import { resetOrderStore } from '../src/stores/order.store';
import { resetDiscountStore } from '../src/stores/discount.store';
import { addItemToCart, createCart } from '../src/services/cart.service';
import { checkout } from '../src/services/checkout.service';
import { generateDiscountCodeIfEligible } from '../src/services/discount.service';
import { getStoreStats } from '../src/services/analytics.service';
import type { Order } from '../src/models/order';

const ORDER_INTERVAL = 5;
const DISCOUNT_PERCENTAGE = 10;

beforeEach(() => {
  resetProductStore();
  resetCartStore();
  resetOrderStore();
  resetDiscountStore();
});

/** Builds a cart, adds the given items, checks out, and returns the order. */
function checkoutCart(items: Array<{ productId: string; quantity: number }>, discountCode?: string): Order {
  const cart = createCart();
  for (const item of items) {
    addItemToCart(cart.id, item.productId, item.quantity);
  }
  return checkout(cart.id, discountCode);
}

describe('getStoreStats', () => {
  it('reports zeros and an empty code list for a fresh store', () => {
    expect(getStoreStats()).toEqual({
      totalItemsPurchased: 0,
      revenue: 0,
      totalDiscountGiven: 0,
      discountCodes: [],
    });
  });

  it('counts total items purchased across every order', () => {
    checkoutCart([{ productId: 'product-1', quantity: 2 }]);
    checkoutCart([
      { productId: 'product-2', quantity: 1 },
      { productId: 'product-3', quantity: 3 },
    ]);

    expect(getStoreStats().totalItemsPurchased).toBe(2 + 1 + 3);
  });

  it('sums revenue as the amount actually paid, net of discounts', () => {
    // 5 plain orders earn one eligibility; the 6th uses the generated code.
    for (let i = 0; i < ORDER_INTERVAL; i++) {
      checkoutCart([{ productId: 'product-1', quantity: 1 }]); // 799 each, no discount
    }
    const discount = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);
    checkoutCart([{ productId: 'product-1', quantity: 1 }], discount.code); // 799, 10% off

    const stats = getStoreStats();
    expect(stats.revenue).toBeCloseTo(799 * ORDER_INTERVAL + 719.1, 5);
    expect(stats.totalDiscountGiven).toBeCloseTo(79.9, 5);
  });

  it('lists every generated discount code, used or not', () => {
    for (let i = 0; i < ORDER_INTERVAL; i++) {
      checkoutCart([{ productId: 'product-1', quantity: 1 }]);
    }
    const discount = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);

    const stats = getStoreStats();
    expect(stats.discountCodes).toHaveLength(1);
    expect(stats.discountCodes[0]).toMatchObject({
      code: discount.code,
      percentage: DISCOUNT_PERCENTAGE,
      milestone: 1,
      used: false, // generated but not yet spent in this test
    });
  });

  it('keeps sum(subtotals) = revenue + totalDiscountGiven across a mix of discounted and plain orders', () => {
    const orders: Order[] = [];
    orders.push(checkoutCart([{ productId: 'product-1', quantity: 2 }]));
    orders.push(checkoutCart([{ productId: 'product-2', quantity: 1 }]));

    for (let i = 0; i < ORDER_INTERVAL - 2; i++) {
      orders.push(checkoutCart([{ productId: 'product-3', quantity: 1 }]));
    }
    // 5 orders completed by now — one eligibility earned.
    const discount = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);
    orders.push(checkoutCart([{ productId: 'product-1', quantity: 3 }], discount.code));

    const sumOfSubtotals = orders.reduce((sum, order) => sum + order.subtotal, 0);
    const stats = getStoreStats();

    expect(stats.revenue + stats.totalDiscountGiven).toBeCloseTo(sumOfSubtotals, 5);
  });
});
