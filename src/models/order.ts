/**
 * One line of a completed order. Unlike CartItem, this is a snapshot —
 * `name` and `unitPrice` are copied from the product at checkout time, not
 * looked up again later. If a product's price changes afterwards, this
 * order (and anything computed from it, like admin stats) still reflects
 * what was actually charged.
 */
export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  /** Present only once discount codes exist (added in a later stage). */
  discountCode?: string;
  discountAmount: number;
  total: number;
  createdAt: Date;
}
