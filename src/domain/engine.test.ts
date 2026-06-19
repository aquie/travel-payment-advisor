import { describe, expect, it } from 'vitest';
import { comparePaymentMethods, validateQuoteInput } from './engine';
import type { QuoteInput } from './types';

const baseInput: QuoteInput = {
  quoteDate: '2026-07-01',
  purchaseAmountJpy: 10_000,
  commonKrwPer100Jpy: 900,
  usdKrw: 1400,
  naverEventApplied: true,
  naverCashbackRemainingKrw: 5000,
  shinhanPreviousMonthEligible: true,
  shinhanOverseasSpendThisMonthKrw: 0,
  asianaMileValueKrw: 15,
};

function method(input: QuoteInput, methodId: string) {
  return comparePaymentMethods(input, '2026-06-19T00:00:00.000Z').rankedMethods.find(
    (item) => item.methodId === methodId,
  )!;
}

describe('comparison engine', () => {
  it('uses Travel Wallet as the exact common-rate cash baseline', () => {
    const result = method(baseInput, 'travel-wallet');
    expect(result.convertedKrw).toBe(90_000);
    expect(result.effectiveCostKrw).toBe(90_000);
  });

  it('separates Toss percentage fee, fixed fee, and 2% cashback after June', () => {
    const result = method(baseInput, 'toss-bank');
    expect(result.percentageFeesKrw).toBe(900);
    expect(result.fixedFeesKrw).toBe(700);
    expect(result.cashbackKrw).toBe(1800);
    expect(result.effectiveCostKrw).toBe(89_800);
  });

  it('changes the Toss versus Travel Wallet order around the fixed-fee boundary', () => {
    const small = comparePaymentMethods({ ...baseInput, purchaseAmountJpy: 5000, naverEventApplied: false, shinhanPreviousMonthEligible: false });
    const large = comparePaymentMethods({ ...baseInput, purchaseAmountJpy: 10_000, naverEventApplied: false, shinhanPreviousMonthEligible: false });
    expect(small.rankedMethods.findIndex((item) => item.methodId === 'travel-wallet')).toBeLessThan(
      small.rankedMethods.findIndex((item) => item.methodId === 'toss-bank'),
    );
    expect(large.rankedMethods.findIndex((item) => item.methodId === 'toss-bank')).toBeLessThan(
      large.rankedMethods.findIndex((item) => item.methodId === 'travel-wallet'),
    );
  });

  it.each([
    { quoteDate: '2026-07-01', naverEventApplied: false },
    { quoteDate: '2025-12-31', naverEventApplied: true },
    { quoteDate: '2027-01-01', naverEventApplied: true },
  ])('does not apply Naver cashback when ineligible: $quoteDate/$naverEventApplied', (change) => {
    expect(method({ ...baseInput, ...change }, 'naver-pay-qr').cashbackKrw).toBe(0);
  });

  it('caps Naver cashback at the user-entered remaining amount and handles zero', () => {
    expect(method(baseInput, 'naver-pay-qr').cashbackKrw).toBe(5000);
    expect(method({ ...baseInput, naverCashbackRemainingKrw: 0 }, 'naver-pay-qr').cashbackKrw).toBe(0);
  });

  it('never exceeds the official 10,000 KRW Naver cashback cap', () => {
    const result = method({
      ...baseInput,
      purchaseAmountJpy: 100_000,
      naverCashbackRemainingKrw: 50_000,
    }, 'naver-pay-qr');
    expect(result.cashbackKrw).toBe(10_000);
  });

  it.each([
    ['2026-06-30', 0.03],
    ['2026-07-01', 0.02],
    ['2026-09-30', 0.02],
    ['2026-10-01', 0],
  ] as const)('applies Toss cashback at the %s boundary', (quoteDate, rate) => {
    const result = method({ ...baseInput, quoteDate }, 'toss-bank');
    expect(result.cashbackKrw).toBe(result.convertedKrw * rate);
  });

  it('sets Shinhan mileage value to zero without previous-month eligibility', () => {
    const result = method({ ...baseInput, shinhanPreviousMonthEligible: false }, 'shinhan-air-1.5');
    expect(result.earnedMiles).toBe(0);
    expect(result.mileageValueKrw).toBe(0);
  });

  it('applies accumulated overseas spend to the 2,000 additional-mile cap', () => {
    const result = method(
      { ...baseInput, purchaseAmountJpy: 100_000, shinhanOverseasSpendThisMonthKrw: 1_000_000 },
      'shinhan-air-1.5',
    );
    expect(result.earnedMiles).toBe(1850);
  });

  it('continues uncapped base mileage after the additional cap is exhausted', () => {
    const result = method(
      { ...baseInput, shinhanOverseasSpendThisMonthKrw: 2_000_000 },
      'shinhan-air-1.5',
    );
    expect(result.earnedMiles).toBe(135);
  });

  it.each([10, 15, 20] as const)('changes only effective cost when a mile is valued at %i KRW', (value) => {
    const result = method({ ...baseInput, asianaMileValueKrw: value }, 'shinhan-air-1.5');
    const cash = result.convertedKrw + result.percentageFeesKrw;
    expect(result.effectiveCostKrw).toBe(cash - result.earnedMiles * value);
  });

  it('applies method-specific rates only to the selected methods', () => {
    const input = { ...baseInput, naverKrwPer100Jpy: 850, shinhanKrwPer100Jpy: 950 };
    expect(method(input, 'travel-wallet').convertedKrw).toBe(90_000);
    expect(method(input, 'toss-bank').convertedKrw).toBe(90_000);
    expect(method(input, 'naver-pay-qr').convertedKrw).toBe(85_000);
    expect(method(input, 'shinhan-air-1.5').convertedKrw).toBe(95_000);
  });

  it('marks a difference exactly equal to 1% as a close call', () => {
    const input = {
      ...baseInput,
      naverEventApplied: false,
      naverKrwPer100Jpy: 950,
      shinhanPreviousMonthEligible: false,
      usdKrw: 3600,
    };
    const result = comparePaymentMethods(input);
    expect(result.rankedMethods[0].methodId).toBe('travel-wallet');
    expect(result.rankedMethods[1].effectiveCostKrw - result.rankedMethods[0].effectiveCostKrw).toBe(900);
    expect(result.isCloseCall).toBe(true);
  });

  it.each([
    ['purchaseAmountJpy', 0],
    ['purchaseAmountJpy', -1],
    ['commonKrwPer100Jpy', Number.NaN],
    ['usdKrw', Number.POSITIVE_INFINITY],
    ['naverCashbackRemainingKrw', -1],
  ] as const)('rejects invalid %s values', (key, value) => {
    expect(() => validateQuoteInput({ ...baseInput, [key]: value })).toThrow(RangeError);
  });

  it.each(['2026-02-29', '2026-02-30', '2026-04-31'])('rejects impossible date %s', (quoteDate) => {
    expect(() => validateQuoteInput({ ...baseInput, quoteDate })).toThrow(RangeError);
  });

  it('rejects finite inputs whose calculated amounts overflow', () => {
    expect(() => comparePaymentMethods({
      ...baseInput,
      purchaseAmountJpy: 1e308,
      commonKrwPer100Jpy: 1e308,
    })).toThrow(/너무 큽니다/);
  });

  it('uses deterministic method order when all effective and cash costs tie', () => {
    const result = comparePaymentMethods({
      ...baseInput,
      quoteDate: '2027-01-01',
      usdKrw: Number.EPSILON,
      naverEventApplied: false,
      shinhanPreviousMonthEligible: false,
    });
    const tied = result.rankedMethods.filter((item) => item.effectiveCostKrw === 90_000);
    expect(tied.map((item) => item.methodId)).toEqual(['travel-wallet', 'naver-pay-qr']);
  });
});
