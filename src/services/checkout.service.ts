import { randomUUID } from 'node:crypto';
import type { Order, OrderItem } from '../models/order';
import { createAppError } from '../errors/appError';
import { getCart } from './cart.service';
import { clearCart } from '../stores/cart.store';
import { findProductById } from '../stores/product.store';
import { saveOrder } from '../stores/order.store';

/**
 * Checks out a cart: resolves real prices, builds and saves the order,
 * then empties the cart. `cartId` is typed `unknown` because it comes
 * straight from a request body — same boundary pattern as
 * cart.service.ts's addItemToCart.
 *
 * Discount code handling is added in a later stage, once a discount store
 * actually exists — for now `discountAmount` is always 0 and `total`
 * always equals `subtotal`.
 */
export function checkout(cartId: unknown): Order {
  if (typeof cartId !== 'string' || cartId.trim() === '') {
    throw createAppError(400, 'VALIDATION_ERROR', 'cartId is required and must be a string');
  }

  const cart = getCart(cartId); // throws 404 CART_NOT_FOUND if missing

  if (cart.items.length === 0) {
    throw createAppError(400, 'CART_EMPTY', 'Cannot checkout an empty cart');
  }

  const orderItems: OrderItem[] = cart.items.map((item) => {
    const product = findProductById(item.productId);
    if (!product) {
      // Defensive: a product can only be missing here if it was removed
      // from the catalogue after already being added to this cart — the
      // catalogue is fixed for this assignment, but this keeps the
      // function honest about what it actually depends on.
      throw createAppError(404, 'PRODUCT_NOT_FOUND', `No product found with id "${item.productId}"`);
    }

    return {
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const order: Order = {
    id: `order_${randomUUID()}`,
    items: orderItems,
    subtotal,
    discountAmount: 0,
    total: subtotal,
    createdAt: new Date(),
  };

  saveOrder(order);
  clearCart(cart);

  return order;
}
