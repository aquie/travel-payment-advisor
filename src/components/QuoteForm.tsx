import type { FormEvent } from 'react';
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

type QuoteFormProps = {
  draft: QuoteDraft;
  error?: string;
  onDraftChange: (draft: QuoteDraft) => void;
  onCompare: (input: QuoteInput) => void;
};

export function QuoteForm({ draft, error, onDraftChange, onCompare }: QuoteFormProps) {
  const update = <K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) => {
    onDraftChange({ ...draft, [key]: value });
  };

  const updateRate = (key: 'commonKrwPer100Jpy' | 'usdKrw', value: string) => {
    onDraftChange({ ...draft, [key]: value, rateUpdatedAt: new Date().toISOString() });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCompare(draftToInput(draft));
  };

  return (
    <form className="quote-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="quote-date">결제 예정일</label>
        <input
          id="quote-date"
          type="date"
          value={draft.quoteDate}
          onChange={(event) => update('quoteDate', event.target.value)}
          required
        />
      </div>

      <div className="field-grid">
        <div className="field amount-field">
          <label htmlFor="purchase-amount">결제 금액</label>
          <div className="input-unit">
            <input
              id="purchase-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="10,000"
              value={draft.purchaseAmountJpy}
              onChange={(event) => update('purchaseAmountJpy', event.target.value)}
              required
            />
            <span>JPY</span>
          </div>
        </div>
        <div className="field amount-field">
          <label htmlFor="common-rate">공통 환율</label>
          <div className="input-unit">
            <span>100 JPY</span>
            <input
              id="common-rate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="직접 입력"
              value={draft.commonKrwPer100Jpy}
              onChange={(event) => updateRate('commonKrwPer100Jpy', event.target.value)}
              required
              aria-describedby="rate-help"
            />
            <span>원</span>
          </div>
          <small id="rate-help">환율 API 없이 확인한 값을 직접 입력해요.</small>
        </div>
      </div>

      <details className="advanced-panel">
        <summary>고급 설정</summary>
        <div className="advanced-fields">
          <div className="field">
            <label htmlFor="usd-rate">USD/KRW 환율</label>
            <input
              id="usd-rate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Toss 고정 수수료 환산용"
              value={draft.usdKrw}
              onChange={(event) => updateRate('usdKrw', event.target.value)}
              required
            />
          </div>
          <div className="rate-overrides">
            <div className="field">
              <label htmlFor="naver-rate">Naver Pay 전용 환율 <em>선택</em></label>
              <input
                id="naver-rate"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="미입력 시 공통 환율"
                value={draft.naverKrwPer100Jpy}
                onChange={(event) => update('naverKrwPer100Jpy', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="shinhan-rate">신한카드 전용 환율 <em>선택</em></label>
              <input
                id="shinhan-rate"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="미입력 시 공통 환율"
                value={draft.shinhanKrwPer100Jpy}
                onChange={(event) => update('shinhanKrwPer100Jpy', event.target.value)}
              />
            </div>
          </div>

          <fieldset>
            <legend>Naver Pay 혜택</legend>
            <label className="switch-row">
              <span>
                이벤트 신청 완료
                <small>신청 후 결제부터 10% 페이백 대상</small>
              </span>
              <input
                type="checkbox"
                checked={draft.naverEventApplied}
                onChange={(event) => update('naverEventApplied', event.target.checked)}
              />
            </label>
            <div className="field inline-field">
              <label htmlFor="naver-remaining">남은 QR 페이백 한도</label>
              <div className="input-unit compact">
                <input
                  id="naver-remaining"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={draft.naverCashbackRemainingKrw}
                  onChange={(event) => update('naverCashbackRemainingKrw', event.target.value)}
                />
                <span>원</span>
              </div>
              <div className="quick-values" aria-label="Naver Pay 잔여 한도 빠른 설정">
                <button type="button" onClick={() => update('naverCashbackRemainingKrw', '5000')}>일반 5천원</button>
                <button type="button" onClick={() => update('naverCashbackRemainingKrw', '10000')}>보험 비교 1만원</button>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>신한 Air 1.5 혜택</legend>
            <label className="switch-row">
              <span>
                전월 50만원 실적 충족
                <small>미충족 시 마일 가치는 0원</small>
              </span>
              <input
                type="checkbox"
                checked={draft.shinhanPreviousMonthEligible}
                onChange={(event) => update('shinhanPreviousMonthEligible', event.target.checked)}
              />
            </label>
            <div className="rate-overrides">
              <div className="field">
                <label htmlFor="monthly-spend">이번 달 해외 이용액</label>
                <div className="input-unit compact">
                  <input
                    id="monthly-spend"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={draft.shinhanOverseasSpendThisMonthKrw}
                    onChange={(event) => update('shinhanOverseasSpendThisMonthKrw', event.target.value)}
                  />
                  <span>원</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="mile-value">1마일 가치</label>
                <select
                  id="mile-value"
                  value={draft.asianaMileValueKrw}
                  onChange={(event) => update('asianaMileValueKrw', Number(event.target.value) as MileValue)}
                >
                  <option value="10">10원</option>
                  <option value="15">15원</option>
                  <option value="20">20원</option>
                </select>
              </div>
            </div>
          </fieldset>
        </div>
      </details>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="primary-action" type="submit">비교하기</button>
    </form>
  );
}
