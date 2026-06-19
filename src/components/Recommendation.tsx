import { METHOD_NAMES } from '../domain/rules';
import type { ComparisonResult, MethodBreakdown } from '../domain/types';

const krw = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

function DetailLine({ label, value, subtract = false }: { label: string; value: number; subtract?: boolean }) {
  return (
    <div className="detail-line">
      <dt>{label}</dt>
      <dd className={subtract && value > 0 ? 'benefit' : undefined}>
        {subtract && value > 0 ? '−' : ''}{krw.format(Math.round(value))}원
      </dd>
    </div>
  );
}

function MethodRow({ method, rank }: { method: MethodBreakdown; rank: number }) {
  return (
    <details className={`method-row ${rank === 1 ? 'winner' : ''}`}>
      <summary>
        <span className="rank" aria-label={`${rank}위`}>{rank}</span>
        <span className="method-name">{METHOD_NAMES[method.methodId]}</span>
        <strong>{krw.format(Math.round(method.effectiveCostKrw))}원</strong>
      </summary>
      <div className="method-detail">
        <dl>
          <DetailLine label="환산 원금" value={method.convertedKrw} />
          <DetailLine label="퍼센트 수수료" value={method.percentageFeesKrw} />
          <DetailLine label="고정 수수료" value={method.fixedFeesKrw} />
          <DetailLine label="캐시백" value={method.cashbackKrw} subtract />
          <DetailLine label={`마일 가치 (${method.earnedMiles.toFixed(1)}마일)`} value={method.mileageValueKrw} subtract />
        </dl>
        <div className="assumption-block">
          <h4>계산 가정</h4>
          <ul>{method.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        {method.warnings.length > 0 ? (
          <div className="warning-block">
            <h4>확인할 점</h4>
            <ul>{method.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function Recommendation({ result }: { result: ComparisonResult }) {
  const [winner, runnerUp] = result.rankedMethods;
  const difference = runnerUp.effectiveCostKrw - winner.effectiveCostKrw;
  const rateTimes = result.input.rateTimestamps;
  const usedRateTimes = rateTimes ? Object.entries(rateTimes).filter(([, value]) => value) : [];

  return (
    <section className="result-section" aria-live="polite" aria-labelledby="result-heading">
      <div className="recommendation">
        <p>이번 결제는</p>
        <h2 id="result-heading" tabIndex={-1}>{METHOD_NAMES[winner.methodId]}</h2>
        <span>예상 유효 비용</span>
        <strong className="hero-cost">약 {krw.format(Math.round(winner.effectiveCostKrw))}원</strong>
        <p className="runner-up">
          {METHOD_NAMES[runnerUp.methodId]}보다 <b>{krw.format(Math.round(difference))}원</b> 절약
        </p>
        {result.isCloseCall ? (
          <p className="close-call">차이가 작으므로 편의성·가맹점 수용 여부를 우선해도 됩니다.</p>
        ) : null}
      </div>

      <div className="ranking">
        <div className="section-heading-row">
          <h3>결제 방법 비교</h3>
          <span>예상 유효비용</span>
        </div>
        {result.rankedMethods.map((item, index) => (
          <MethodRow key={item.methodId} method={item} rank={index + 1} />
        ))}
      </div>
      <p className="calculated-at">계산 시각 {new Date(result.calculatedAt).toLocaleString('ko-KR')}</p>
      {usedRateTimes.length > 0 ? (
        <p className="calculated-at">
          환율 확인 시각 {usedRateTimes.map(([key, value]) =>
            `${key === 'commonKrwPer100Jpy' ? '공통 JPY' : key === 'usdKrw' ? 'USD' : key === 'naverKrwPer100Jpy' ? 'Naver' : '신한'} ${new Date(value as string).toLocaleString('ko-KR')}`
          ).join(' · ')}
        </p>
      ) : null}
    </section>
  );
}
