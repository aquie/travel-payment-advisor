import type { DatedRule, MethodId } from './types';

export const METHOD_ORDER: MethodId[] = [
  'travel-wallet',
  'toss-bank',
  'naver-pay-qr',
  'shinhan-air-1.5',
];

export const METHOD_NAMES: Record<MethodId, string> = {
  'travel-wallet': '트래블월렛',
  'toss-bank': '토스뱅크',
  'naver-pay-qr': 'Naver Pay 해외 QR',
  'shinhan-air-1.5': '신한 Air 1.5',
};

export const PAYMENT_RULES = {
  travelWallet: {
    exchangeRate: {
      id: 'travel-wallet-jpy-base-rate',
      label: 'JPY 매매기준율 적용',
      methodId: 'travel-wallet',
      sourceUrl: 'https://www.travel-wallet.com/ko/docs/travelpay_terms',
      lastVerifiedAt: '2026-06-19',
    },
    cardFee: {
      id: 'travel-wallet-card-fee-zero',
      label: '카드 결제 수수료 0%',
      methodId: 'travel-wallet',
      sourceUrl: 'https://www.travel-wallet.com/ko/docs/travelpay_terms',
      lastVerifiedAt: '2026-06-19',
      rate: 0,
    },
  },
  toss: {
    japanCashback: {
      id: 'toss-japan-cashback-3',
      label: '일본 결제 3% 캐시백',
      methodId: 'toss-bank',
      validFrom: '2026-04-01',
      validThrough: '2026-06-30',
      sourceUrl: 'https://www.tossbank.com/card/japan-cashback',
      lastVerifiedAt: '2026-06-19',
      rate: 0.03,
    },
    overseasCashback: {
      id: 'toss-overseas-cashback-2',
      label: '해외 결제 2% 캐시백',
      methodId: 'toss-bank',
      validFrom: '2026-04-01',
      validThrough: '2026-09-30',
      sourceUrl: 'https://www.tossbank.com/card/benefits',
      lastVerifiedAt: '2026-06-19',
      rate: 0.02,
    },
    fees: {
      id: 'toss-overseas-fees',
      label: '국제브랜드 1% + 건당 USD 0.50',
      methodId: 'toss-bank',
      sourceUrl: 'https://www.tossbank.com/card/benefits',
      lastVerifiedAt: '2026-06-19',
      rate: 0.01,
      fixedFeeUsd: 0.5,
    },
  },
  naver: {
    cashback: {
      id: 'naver-overseas-travel-cashback-10',
      label: '해외여행 10% 페이백',
      methodId: 'naver-pay-qr',
      validFrom: '2026-01-01',
      validThrough: '2026-12-31',
      sourceUrl: 'https://campaign2.naver.com/global10save3/',
      lastVerifiedAt: '2026-06-19',
      rate: 0.1,
      cashbackCapKrw: 10_000,
    },
    exchangeGuide: {
      id: 'naver-overseas-qr-exchange-guide',
      label: '해외 QR 원화 환산 안내',
      methodId: 'naver-pay-qr',
      sourceUrl: 'https://help.pay.naver.com/faq/content.help?faqId=14390',
      lastVerifiedAt: '2026-06-19',
    },
  },
  shinhan: {
    mileage: {
      id: 'shinhan-air-1.5-mileage',
      label: '해외 기본 1.5 + 추가 1.5마일',
      methodId: 'shinhan-air-1.5',
      sourceUrl:
        'https://www.shinhancard.com/pconts/html/card/apply/credit/1188278_2207.html',
      lastVerifiedAt: '2026-06-19',
      baseMilesPer1000Krw: 1.5,
      additionalMilesPer1000Krw: 1.5,
      additionalMilesCap: 2_000,
    },
    fees: {
      id: 'shinhan-mastercard-overseas-fees',
      label: 'Mastercard 1% + 신한 해외서비스 0.18%',
      methodId: 'shinhan-air-1.5',
      sourceUrl:
        'https://www.shinhancard.com/pconts/html/card/apply/credit/1228373_2207.html',
      lastVerifiedAt: '2026-06-19',
      rate: 0.0118,
    },
  },
} as const satisfies Record<string, Record<string, DatedRule>>;

export const ALL_RULES: DatedRule[] = Object.values(PAYMENT_RULES).flatMap((method) =>
  Object.values(method),
);

export function isRuleActive(rule: DatedRule, date: string): boolean {
  return (!rule.validFrom || date >= rule.validFrom) &&
    (!rule.validThrough || date <= rule.validThrough);
}
