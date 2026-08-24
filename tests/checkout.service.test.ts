import { beforeEach, describe, expect, it } from 'vitest';
import { resetProductStore } from '../src/stores/product.store';
import { resetCartStore } from '../src/stores/cart.store';
import { countOrders, resetOrderStore } from '../src/stores/order.store';
import { addItemToCart, createCart, getCart } from '../src/services/cart.service';
import { checkout } from '../src/services/checkout.service';
import { isAppError } from '../src/errors/appError';

beforeEach(() => {
  resetProductStore();
  resetCartStore();
  resetOrderStore();
});

/** Same helper as cart.service.test.ts — see that file for why it exists. */
function expectAppError(fn: () => unknown, statusCode: number, code: string): void {
  try {
    fn();
  } catch (error) {
    if (!isAppError(error)) throw error;
    expect(error.statusCode).toBe(statusCode);
    expect(error.code).toBe(code);
    return;
  }
  expect.fail('expected the function to throw an AppError, but it did not throw');
}

describe('checkout', () => {
  it('computes the subtotal from server-side prices, not anything the client could send', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 2); // Wireless Mouse, 799 each
    addItemToCart(cart.id, 'product-2', 1); // Mechanical Keyboard, 3499

    const order = checkout(cart.id);

    expect(order.subtotal).toBe(799 * 2 + 3499);
    expect(order.discountAmount).toBe(0);
    expect(order.total).toBe(order.subtotal);
  });

  it('builds each order line as a price snapshot', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 2);

    const order = checkout(cart.id);

    expect(order.items).toEqual([
      { productId: 'product-1', name: 'Wireless Mouse', unitPrice: 799, quantity: 2, lineTotal: 1598 },
    ]);
  });

  it('gives the order an id and a creation timestamp', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    const order = checkout(cart.id);

    expect(order.id).toMatch(/^order_/);
    expect(order.createdAt).toBeInstanceOf(Date);
  });

  it('clears the cart after a successful checkout', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    checkout(cart.id);

    expect(getCart(cart.id).items).toEqual([]);
  });

  it('rejects an empty cart and creates no order', () => {
    const cart = createCart();

    expectAppError(() => checkout(cart.id), 400, 'CART_EMPTY');
    expect(countOrders()).toBe(0);
  });

  it('rejects an unknown cart and creates no order', () => {
    expectAppError(() => checkout('does-not-exist'), 404, 'CART_NOT_FOUND');
    expect(countOrders()).toBe(0);
  });

  it('rejects a missing or non-string cartId', () => {
    expectAppError(() => checkout(undefined), 400, 'VALIDATION_ERROR');
    expect(countOrders()).toBe(0);
  });
});
