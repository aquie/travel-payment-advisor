import { ALL_RULES } from '../domain/rules';

export function OfficialSources() {
  return (
    <details className="source-section" id="official-sources">
      <summary>공식 조건과 확인일</summary>
      <p>아래 공식 자료를 2026년 6월 19일에 다시 확인했습니다.</p>
      <ul>
        {ALL_RULES.map((rule) => (
          <li key={rule.id}>
            <a href={rule.sourceUrl} target="_blank" rel="noreferrer">{rule.label}</a>
            {rule.validFrom || rule.validThrough ? (
              <small>{rule.validFrom ?? '시작일 제한 없음'} ~ {rule.validThrough ?? '종료일 제한 없음'}</small>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="source-note">기간이 지난 혜택은 자동 적용하지 않습니다. PayPay 별도 할인은 MVP 계산에 포함하지 않았습니다.</p>
    </details>
  );
}
