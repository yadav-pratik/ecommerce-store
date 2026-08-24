import { beforeEach, describe, expect, it } from 'vitest';
import { findDiscountByCode, resetDiscountStore, saveDiscountCode } from '../src/stores/discount.store';
import { calculateDiscountAmount, consumeDiscountCode, validateDiscountCode } from '../src/services/discount.service';
import { isAppError } from '../src/errors/appError';
import type { DiscountCode } from '../src/models/discount';

beforeEach(() => {
  resetDiscountStore();
});

/** Same helper as cart.service.test.ts — see that file for why it exists. */
function expectAppError(fn: () => unknown, statusCode: number, code: string): void {
  try {
    fn();
  } catch (error) {
    if (!isAppError(error)) throw error;
    expect(error.statusCode).toBe(statusCode);
    expect(error.code).toBe(code);
    return;
  }
  expect.fail('expected the function to throw an AppError, but it did not throw');
}

function seedDiscount(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return saveDiscountCode({
    code: 'SAVE10-TEST',
    percentage: 10,
    milestone: 1,
    used: false,
    createdAt: new Date(),
    ...overrides,
  });
}

describe('validateDiscountCode', () => {
  it('returns a valid, unused code', () => {
    seedDiscount({ code: 'SAVE10-TEST' });
    expect(validateDiscountCode('SAVE10-TEST').code).toBe('SAVE10-TEST');
  });

  it('rejects an unknown code', () => {
    expectAppError(() => validateDiscountCode('DOES-NOT-EXIST'), 400, 'INVALID_DISCOUNT_CODE');
  });

  it('rejects a code that has already been used', () => {
    seedDiscount({ used: true, usedByOrderId: 'order_1' });
    expectAppError(() => validateDiscountCode('SAVE10-TEST'), 400, 'INVALID_DISCOUNT_CODE');
  });
});

describe('calculateDiscountAmount', () => {
  it('applies the percentage to the subtotal', () => {
    const discount = seedDiscount({ percentage: 10 });
    expect(calculateDiscountAmount(1000, discount)).toBe(100);
  });

  it('rounds to 2 decimal places instead of leaving floating-point noise', () => {
    const discount = seedDiscount({ percentage: 10 });
    // 19.99 * 10 / 100 = 1.999, which should round to the nearest cent.
    expect(calculateDiscountAmount(19.99, discount)).toBe(2);
  });
});

describe('consumeDiscountCode', () => {
  it('marks a code as used and records which order used it', () => {
    const discount = seedDiscount();

    consumeDiscountCode(discount, 'order_123');

    const stored = findDiscountByCode('SAVE10-TEST');
    expect(stored?.used).toBe(true);
    expect(stored?.usedByOrderId).toBe('order_123');
  });
});
