/**
 * A discount code. `percentage` is copied onto the code at generation
 * time (Stage 10), not looked up from config at checkout — so validating
 * and applying a code never needs to know how it was created.
 *
 * `milestone` (which nth-order eligibility this code was generated for)
 * is added in Stage 10, once the generation logic that actually needs it
 * exists — nothing here uses it yet.
 */
export interface DiscountCode {
  code: string;
  percentage: number;
  used: boolean;
  usedByOrderId?: string;
  createdAt: Date;
}
