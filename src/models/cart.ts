/**
 * One product-and-quantity line inside a cart. No price here — see
 * models/product.ts for why prices only ever come from the server.
 */
export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  createdAt: Date;
}
