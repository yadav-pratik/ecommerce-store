import type { Cart } from '../models/cart';
import { createAppError } from '../errors/appError';
import { findProductById } from '../stores/product.store';
import {
  createCart as insertCart,
  findCartById,
  addItemToCart as mergeItemIntoCart,
} from '../stores/cart.store';

/**
 * Business rules for carts live here, not in the store (which only knows
 * how to store data) and not in the route (which only knows HTTP). This
 * is the layer that gets unit-tested directly.
 */

export function createCart(): Cart {
  // No validation needed to create an empty cart — this still goes
  // through the service, rather than the route calling the store
  // directly, so every cart route follows the same route → service →
  // store path, even the one route with no rules of its own.
  return insertCart();
}

export function getCart(cartId: string): Cart {
  const cart = findCartById(cartId);
  if (!cart) {
    throw createAppError(404, 'CART_NOT_FOUND', `No cart found with id "${cartId}"`);
  }
  return cart;
}

/**
 * Adds a product to a cart. `productId` and `quantity` are typed `unknown`
 * because they come straight from a request body — this function is the
 * boundary that checks they're actually usable before touching the store.
 */
export function addItemToCart(cartId: string, productId: unknown, quantity: unknown): Cart {
  const cart = getCart(cartId);

  if (typeof productId !== 'string' || productId.trim() === '') {
    throw createAppError(400, 'VALIDATION_ERROR', 'productId is required and must be a string');
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    throw createAppError(400, 'INVALID_QUANTITY', 'quantity must be a positive integer');
  }

  const product = findProductById(productId);
  if (!product) {
    throw createAppError(404, 'PRODUCT_NOT_FOUND', `No product found with id "${productId}"`);
  }

  return mergeItemIntoCart(cart, productId, quantity);
}
