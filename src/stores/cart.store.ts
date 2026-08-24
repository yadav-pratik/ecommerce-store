import { randomUUID } from 'node:crypto';
import type { Cart } from '../models/cart';

/**
 * In-memory cart storage — same shape as stores/product.store.ts: one Map
 * owned by this module, plain functions to read and write it, no class.
 */
let carts = new Map<string, Cart>();

export function createCart(): Cart {
  const cart: Cart = {
    id: `cart_${randomUUID()}`,
    items: [],
    createdAt: new Date(),
  };
  carts.set(cart.id, cart);
  return cart;
}

export function findCartById(id: string): Cart | undefined {
  return carts.get(id);
}

/**
 * Adds a product to a cart, merging into an existing line item if that
 * product is already in the cart instead of creating a duplicate one.
 *
 * Takes the actual Cart object (already looked up by the caller) rather
 * than a cartId, and mutates its `items` array directly. That's safe here
 * because the Map stores this exact object by reference — updating the
 * object updates what's in the Map too, so there's no separate "save"
 * step to forget.
 */
export function addItemToCart(cart: Cart, productId: string, quantity: number): Cart {
  const existingItem = cart.items.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  return cart;
}

/**
 * Empties a cart's items after a successful checkout. Same in-place
 * mutation approach as addItemToCart — the cart record itself stays (its
 * id remains valid), only its contents are cleared.
 */
export function clearCart(cart: Cart): void {
  cart.items = [];
}

/** Test-only helper — clears every cart back to an empty store. */
export function resetCartStore(): void {
  carts = new Map();
}
