import type { Product } from '../models/product';
import { SEED_PRODUCTS } from '../config/products';

/**
 * In-memory product catalogue.
 *
 * This module owns one Map, created the moment this file is first
 * imported. Every function below reads or writes that same Map directly —
 * nothing is passed in from outside, and nothing is a class. Any file
 * that needs the catalogue just imports these functions and calls them.
 *
 * `resetProductStore` exists purely for tests: it puts the catalogue back
 * to a known list instead of a test depending on whatever state a
 * previous test left behind.
 */
let products = new Map<string, Product>(SEED_PRODUCTS.map((product) => [product.id, product]));

export function findAllProducts(): Product[] {
  return [...products.values()];
}

export function findProductById(id: string): Product | undefined {
  return products.get(id);
}

/** Test-only helper — resets the catalogue to a known set of products. */
export function resetProductStore(seed: Product[] = SEED_PRODUCTS): void {
  products = new Map(seed.map((product) => [product.id, product]));
}
