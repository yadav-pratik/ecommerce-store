/**
 * A discount code. `percentage` is copied onto the code at generation
 * time, not looked up from config at checkout — so validating and
 * applying a code never needs to know how it was created.
 *
 * `milestone` is which nth-order eligibility this code was generated for
 * (order n → milestone 1, order 2n → milestone 2, …). Generation always
 * claims the lowest not-yet-claimed milestone, which is what makes "the
 * same milestone can never produce two codes" a property of the data —
 * counting how many codes exist tells you which milestone is next.
 */
export interface DiscountCode {
  code: string;
  percentage: number;
  milestone: number;
  used: boolean;
  usedByOrderId?: string;
  createdAt: Date;
}
