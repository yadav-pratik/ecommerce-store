/**
 * A product in the catalogue.
 *
 * Price lives here, server-side, and nowhere else — carts only ever store
 * a productId + quantity (see models/cart.ts, added in Stage 4), so a
 * client can never influence what it pays at checkout.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
}
