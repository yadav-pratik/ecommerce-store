/**
 * Discount system configuration: every `ORDER_INTERVAL`th completed order
 * earns one coupon-generation opportunity, worth `DISCOUNT_PERCENTAGE`%.
 *
 * Read from the environment once, here, at module load — not inside the
 * service functions that use these values. That's what lets a test pass
 * a different n/x directly into a function call without having to touch
 * the environment (see IMPLEMENTATION_PLAN.md §5/§11).
 */
function readPositiveInt(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (raw === undefined) return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${envVar} must be a positive integer, got "${raw}"`);
  }
  return parsed;
}

export const ORDER_INTERVAL = readPositiveInt('ORDER_INTERVAL', 5);
export const DISCOUNT_PERCENTAGE = readPositiveInt('DISCOUNT_PERCENTAGE', 10);
