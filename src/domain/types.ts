export type MethodId =
  | 'travel-wallet'
  | 'toss-bank'
  | 'naver-pay-qr'
  | 'shinhan-air-1.5';

export type MileValue = 10 | 15 | 20;

export type QuoteInput = {
  quoteDate: string;
  purchaseAmountJpy: number;
  commonKrwPer100Jpy: number;
  usdKrw: number;
  naverKrwPer100Jpy?: number;
  shinhanKrwPer100Jpy?: number;
  naverEventApplied: boolean;
  naverCashbackRemainingKrw: number;
  shinhanPreviousMonthEligible: boolean;
  shinhanOverseasSpendThisMonthKrw: number;
  asianaMileValueKrw: MileValue;
};

export type MethodBreakdown = {
  methodId: MethodId;
  convertedKrw: number;
  percentageFeesKrw: number;
  fixedFeesKrw: number;
  cashbackKrw: number;
  earnedMiles: number;
  mileageValueKrw: number;
  effectiveCostKrw: number;
  assumptions: string[];
  warnings: string[];
};

export type ComparisonResult = {
  calculatedAt: string;
  input: QuoteInput;
  rankedMethods: MethodBreakdown[];
  isCloseCall: boolean;
};

export type DatedRule = {
  id: string;
  label: string;
  methodId: MethodId;
  validFrom?: string;
  validThrough?: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  rate?: number;
  fixedFeeUsd?: number;
  cashbackCapKrw?: number;
  baseMilesPer1000Krw?: number;
  additionalMilesPer1000Krw?: number;
  additionalMilesCap?: number;
};
