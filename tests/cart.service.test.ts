import { beforeEach, describe, expect, it } from 'vitest';
import { resetProductStore } from '../src/stores/product.store';
import { resetCartStore } from '../src/stores/cart.store';
import { addItemToCart, createCart, getCart } from '../src/services/cart.service';
import { isAppError } from '../src/errors/appError';

/**
 * Both stores are module-level singletons (see IMPLEMENTATION_PLAN §5), so
 * without a reset, one test's carts/products would still be sitting there
 * for the next test. Resetting both before every test is what keeps these
 * tests deterministic and order-independent.
 */
beforeEach(() => {
  resetProductStore();
  resetCartStore();
});

/**
 * Calls `fn`, expects it to throw an AppError, and checks the status code
 * and error code match. Written once here rather than relying on vitest's
 * `toThrow(message)` — that only matches on message text, and what we
 * actually care about is the HTTP status/code a route would send back.
 */
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

describe('createCart', () => {
  it('creates a new cart with a generated id and no items', () => {
    const cart = createCart();
    expect(cart.id).toMatch(/^cart_/);
    expect(cart.items).toEqual([]);
  });

  it('gives each cart a different id', () => {
    const first = createCart();
    const second = createCart();
    expect(first.id).not.toBe(second.id);
  });
});

describe('getCart', () => {
  it('returns a cart that exists', () => {
    const created = createCart();
    expect(getCart(created.id)).toEqual(created);
  });

  it('rejects an unknown cart', () => {
    expectAppError(() => getCart('does-not-exist'), 404, 'CART_NOT_FOUND');
  });
});

describe('addItemToCart', () => {
  it('adds a product to an empty cart', () => {
    const cart = createCart();
    const updated = addItemToCart(cart.id, 'product-1', 1);
    expect(updated.items).toEqual([{ productId: 'product-1', quantity: 1 }]);
  });

  it('increases quantity instead of duplicating when the same product is added again', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 2);
    const updated = addItemToCart(cart.id, 'product-1', 3);

    expect(updated.items).toEqual([{ productId: 'product-1', quantity: 5 }]);
  });

  it('keeps different products as separate line items', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);
    const updated = addItemToCart(cart.id, 'product-2', 4);

    expect(updated.items).toEqual([
      { productId: 'product-1', quantity: 1 },
      { productId: 'product-2', quantity: 4 },
    ]);
  });

  it('rejects an unknown cart', () => {
    expectAppError(() => addItemToCart('does-not-exist', 'product-1', 1), 404, 'CART_NOT_FOUND');
  });

  it('rejects an unknown product', () => {
    const cart = createCart();
    expectAppError(() => addItemToCart(cart.id, 'does-not-exist', 1), 404, 'PRODUCT_NOT_FOUND');
  });

  it('rejects a missing or non-string productId', () => {
    const cart = createCart();
    expectAppError(() => addItemToCart(cart.id, undefined, 1), 400, 'VALIDATION_ERROR');
  });

  it.each([0, -1, 1.5, '2', undefined, null])('rejects an invalid quantity: %p', (quantity) => {
    const cart = createCart();
    expectAppError(() => addItemToCart(cart.id, 'product-1', quantity), 400, 'INVALID_QUANTITY');
  });
});
