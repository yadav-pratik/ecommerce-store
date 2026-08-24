import type { Product } from '../models/product';

/**
 * Seeded product catalogue.
 *
 * The assignment has no product-management API, so a small fixed set is
 * seeded here instead. This is the only place product prices are defined.
 */
export const SEED_PRODUCTS: Product[] = [
  { id: 'product-1', name: 'Wireless Mouse', price: 799 },
  { id: 'product-2', name: 'Mechanical Keyboard', price: 3499 },
  { id: 'product-3', name: 'USB-C Hub', price: 1299 },
];
