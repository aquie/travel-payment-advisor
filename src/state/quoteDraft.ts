import type { MileValue, QuoteInput } from '../domain/types';

export type QuoteDraft = {
  quoteDate: string;
  purchaseAmountJpy: string;
  commonKrwPer100Jpy: string;
  usdKrw: string;
  naverKrwPer100Jpy: string;
  shinhanKrwPer100Jpy: string;
  naverEventApplied: boolean;
  naverCashbackRemainingKrw: string;
  shinhanPreviousMonthEligible: boolean;
  shinhanOverseasSpendThisMonthKrw: string;
  asianaMileValueKrw: MileValue;
  rateUpdatedAt?: string;
};

function localDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function createDefaultDraft(): QuoteDraft {
  return {
    quoteDate: localDate(),
    purchaseAmountJpy: '',
    commonKrwPer100Jpy: '',
    usdKrw: '',
    naverKrwPer100Jpy: '',
    shinhanKrwPer100Jpy: '',
    naverEventApplied: false,
    naverCashbackRemainingKrw: '5000',
    shinhanPreviousMonthEligible: false,
    shinhanOverseasSpendThisMonthKrw: '0',
    asianaMileValueKrw: 15,
  };
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

export function draftToInput(draft: QuoteDraft): QuoteInput {
  return {
    quoteDate: draft.quoteDate,
    purchaseAmountJpy: Number(draft.purchaseAmountJpy),
    commonKrwPer100Jpy: Number(draft.commonKrwPer100Jpy),
    usdKrw: Number(draft.usdKrw),
    naverKrwPer100Jpy: optionalNumber(draft.naverKrwPer100Jpy),
    shinhanKrwPer100Jpy: optionalNumber(draft.shinhanKrwPer100Jpy),
    naverEventApplied: draft.naverEventApplied,
    naverCashbackRemainingKrw: Number(draft.naverCashbackRemainingKrw),
    shinhanPreviousMonthEligible: draft.shinhanPreviousMonthEligible,
    shinhanOverseasSpendThisMonthKrw: Number(draft.shinhanOverseasSpendThisMonthKrw),
    asianaMileValueKrw: draft.asianaMileValueKrw,
  };
}

export function isRateStale(rateUpdatedAt?: string, now = Date.now()): boolean {
  if (!rateUpdatedAt) return false;
  const timestamp = Date.parse(rateUpdatedAt);
  return Number.isFinite(timestamp) && now - timestamp > 24 * 60 * 60 * 1000;
}
