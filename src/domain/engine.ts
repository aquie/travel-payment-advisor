import { isRuleActive, METHOD_ORDER, PAYMENT_RULES } from './rules';
import type { ComparisonResult, MethodBreakdown, QuoteInput } from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MILE_VALUES = new Set([10, 15, 20]);

function assertFinite(name: string, value: number, allowZero = true): void {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new RangeError(`${name} 값이 올바르지 않습니다.`);
  }
}

export function validateQuoteInput(input: QuoteInput): void {
  const [year, month, day] = input.quoteDate.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (!DATE_PATTERN.test(input.quoteDate) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day) {
    throw new RangeError('결제 예정일 형식이 올바르지 않습니다.');
  }

  assertFinite('결제 금액', input.purchaseAmountJpy, false);
  assertFinite('공통 환율', input.commonKrwPer100Jpy, false);
  assertFinite('USD/KRW 환율', input.usdKrw, false);
  assertFinite('Naver Pay 잔여 캐시백', input.naverCashbackRemainingKrw);
  assertFinite('신한 이번 달 해외 이용액', input.shinhanOverseasSpendThisMonthKrw);

  if (input.naverKrwPer100Jpy !== undefined) {
    assertFinite('Naver Pay 전용 환율', input.naverKrwPer100Jpy, false);
  }
  if (input.shinhanKrwPer100Jpy !== undefined) {
    assertFinite('신한 전용 환율', input.shinhanKrwPer100Jpy, false);
  }
  if (!MILE_VALUES.has(input.asianaMileValueKrw)) {
    throw new RangeError('마일 가치는 10원, 15원, 20원 중 하나여야 합니다.');
  }
  if (input.rateTimestamps && Object.values(input.rateTimestamps).some(
    (timestamp) => timestamp !== undefined && !Number.isFinite(Date.parse(timestamp)),
  )) {
    throw new RangeError('환율 확인 시각이 올바르지 않습니다.');
  }
}

function converted(amountJpy: number, ratePer100Jpy: number): number {
  return (amountJpy * ratePer100Jpy) / 100;
}

function completeBreakdown(
  breakdown: Omit<MethodBreakdown, 'effectiveCostKrw'>,
): MethodBreakdown {
  const completed = {
    ...breakdown,
    effectiveCostKrw:
      breakdown.convertedKrw +
      breakdown.percentageFeesKrw +
      breakdown.fixedFeesKrw -
      breakdown.cashbackKrw -
      breakdown.mileageValueKrw,
  };
  for (const [name, value] of Object.entries(completed)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new RangeError(`${name} 계산 결과가 너무 큽니다.`);
    }
  }
  return completed;
}

function calculateTravelWallet(input: QuoteInput): MethodBreakdown {
  return completeBreakdown({
    methodId: 'travel-wallet',
    convertedKrw: converted(input.purchaseAmountJpy, input.commonKrwPer100Jpy),
    percentageFeesKrw: 0,
    fixedFeesKrw: 0,
    cashbackKrw: 0,
    earnedMiles: 0,
    mileageValueKrw: 0,
    assumptions: ['입력한 공통 환율을 JPY 매매기준율로 사용', '카드 결제 수수료 0%'],
    warnings: ['충전 시점의 앱 고시 환율과 입력값이 다르면 실제 비용도 달라집니다.'],
  });
}

function tossCashbackRate(input: QuoteInput): { rate: number; warning?: string } {
  if (isRuleActive(PAYMENT_RULES.toss.japanCashback, input.quoteDate)) {
    return { rate: PAYMENT_RULES.toss.japanCashback.rate };
  }
  if (isRuleActive(PAYMENT_RULES.toss.overseasCashback, input.quoteDate)) {
    return { rate: PAYMENT_RULES.toss.overseasCashback.rate };
  }
  return {
    rate: 0,
    warning: '선택한 날짜에는 공식 확인된 해외 캐시백 기간이 아니어서 캐시백을 적용하지 않았습니다.',
  };
}

function calculateToss(input: QuoteInput): MethodBreakdown {
  const convertedKrw = converted(input.purchaseAmountJpy, input.commonKrwPer100Jpy);
  const cashback = tossCashbackRate(input);
  return completeBreakdown({
    methodId: 'toss-bank',
    convertedKrw,
    percentageFeesKrw: convertedKrw * PAYMENT_RULES.toss.fees.rate,
    fixedFeesKrw: input.usdKrw * PAYMENT_RULES.toss.fees.fixedFeeUsd,
    cashbackKrw: convertedKrw * cashback.rate,
    earnedMiles: 0,
    mileageValueKrw: 0,
    assumptions: [
      '토스뱅크 외화통장이 해외 결제계좌로 연결됨',
      `국제브랜드 수수료 1%, 해외서비스 수수료 USD 0.50`,
      `공식 확인 기간의 해외 캐시백 ${cashback.rate * 100}% 적용`,
    ],
    warnings: [
      '실제 캐시백은 USD 거래금액과 승인·매입 시점 전신환매도율을 사용한 근삿값입니다.',
      ...(cashback.warning ? [cashback.warning] : []),
    ],
  });
}

function calculateNaver(input: QuoteInput): MethodBreakdown {
  const convertedKrw = converted(
    input.purchaseAmountJpy,
    input.naverKrwPer100Jpy ?? input.commonKrwPer100Jpy,
  );
  const eventActive = isRuleActive(PAYMENT_RULES.naver.cashback, input.quoteDate);
  const cashbackRule = PAYMENT_RULES.naver.cashback;
  const cashback = input.naverEventApplied && eventActive
    ? Math.min(convertedKrw * cashbackRule.rate, input.naverCashbackRemainingKrw, cashbackRule.cashbackCapKrw)
    : 0;
  const warnings: string[] = [
    '네트워크·중개 수수료를 별도 추정하지 않았습니다. 확인한 예상 환율을 전용 환율에 입력하세요.',
  ];
  if (!input.naverEventApplied) {
    warnings.push('이벤트 미신청 상태이므로 페이백을 적용하지 않았습니다.');
  }
  if (!eventActive) {
    warnings.push('선택한 날짜는 공식 이벤트 기간 밖이므로 페이백을 적용하지 않았습니다.');
  }

  return completeBreakdown({
    methodId: 'naver-pay-qr',
    convertedKrw,
    percentageFeesKrw: 0,
    fixedFeesKrw: 0,
    cashbackKrw: cashback,
    earnedMiles: 0,
    mileageValueKrw: 0,
    assumptions: [
      input.naverKrwPer100Jpy === undefined
        ? '전용 환율 미입력으로 공통 환율 사용'
        : '사용자가 입력한 Naver Pay 전용 환율 사용',
      '이벤트 신청 후 결제분의 10%를 입력한 잔여 한도까지만 적용',
    ],
    warnings,
  });
}

function calculateShinhan(input: QuoteInput): MethodBreakdown {
  const convertedKrw = converted(
    input.purchaseAmountJpy,
    input.shinhanKrwPer100Jpy ?? input.commonKrwPer100Jpy,
  );
  let baseMiles = 0;
  let additionalMiles = 0;

  if (input.shinhanPreviousMonthEligible) {
    const mileageRule = PAYMENT_RULES.shinhan.mileage;
    baseMiles = (convertedKrw / 1000) * mileageRule.baseMilesPer1000Krw;
    const usedAdditionalMiles = Math.min(
      mileageRule.additionalMilesCap,
      (input.shinhanOverseasSpendThisMonthKrw / 1000) * mileageRule.additionalMilesPer1000Krw,
    );
    additionalMiles = Math.min(
      (convertedKrw / 1000) * mileageRule.additionalMilesPer1000Krw,
      mileageRule.additionalMilesCap - usedAdditionalMiles,
    );
  }

  const earnedMiles = baseMiles + additionalMiles;
  return completeBreakdown({
    methodId: 'shinhan-air-1.5',
    convertedKrw,
    percentageFeesKrw: convertedKrw * PAYMENT_RULES.shinhan.fees.rate,
    fixedFeesKrw: 0,
    cashbackKrw: 0,
    earnedMiles,
    mileageValueKrw: earnedMiles * input.asianaMileValueKrw,
    assumptions: [
      input.shinhanKrwPer100Jpy === undefined
        ? '전용 환율 미입력으로 공통 환율 사용'
        : '사용자가 입력한 신한 전용 환율 사용',
      'Mastercard 1%와 신한 해외서비스 수수료 0.18% 적용',
      '기본 1.5마일은 월 한도 없음, 추가 1.5마일은 월 2,000마일 한도',
    ],
    warnings: [
      ...(input.shinhanPreviousMonthEligible
        ? []
        : ['전월 50만원 실적 미충족 상태이므로 마일리지를 0으로 계산했습니다.']),
      '실제 Mastercard 환산과 신한 접수일 전신환매도율은 입력 환율과 다를 수 있습니다.',
    ],
  });
}

function cashCost(method: MethodBreakdown): number {
  return method.convertedKrw + method.percentageFeesKrw + method.fixedFeesKrw - method.cashbackKrw;
}

export function comparePaymentMethods(
  input: QuoteInput,
  calculatedAt = new Date().toISOString(),
): ComparisonResult {
  validateQuoteInput(input);
  const rankedMethods = [
    calculateTravelWallet(input),
    calculateToss(input),
    calculateNaver(input),
    calculateShinhan(input),
  ].sort((a, b) =>
    a.effectiveCostKrw - b.effectiveCostKrw ||
    cashCost(a) - cashCost(b) ||
    METHOD_ORDER.indexOf(a.methodId) - METHOD_ORDER.indexOf(b.methodId),
  );
  const [first, second] = rankedMethods;

  return {
    calculatedAt,
    input: { ...input },
    rankedMethods,
    isCloseCall: second.effectiveCostKrw - first.effectiveCostKrw <= first.effectiveCostKrw * 0.01,
  };
}
