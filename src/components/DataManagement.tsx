import { useState } from 'react';
import { METHOD_NAMES } from '../domain/rules';
import type { ComparisonResult } from '../domain/types';
import { createExportJson, type StoredDocument } from '../storage/localStore';

const krw = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

type DataManagementProps = {
  document: StoredDocument;
  onReset: () => void;
};

export function DataManagement({ document, onReset }: DataManagementProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([createExportJson(document)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `travel-payment-advisor-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="data-section" id="data-management" aria-labelledby="data-heading">
      <div className="section-heading-row">
        <h2 id="data-heading">최근 비교와 데이터</h2>
        <span>최근 7일 · 이 기기만</span>
      </div>
      {document.recentComparisons.length > 0 ? (
        <ol className="history-list">
          {document.recentComparisons.map((item) => <HistoryItem key={item.calculatedAt} item={item} />)}
        </ol>
      ) : <p className="empty-history">아직 저장된 비교가 없습니다.</p>}
      <div className="data-actions">
        <button type="button" onClick={exportData}>JSON 내보내기</button>
        {!confirmingReset ? (
          <button className="danger-button" type="button" onClick={() => setConfirmingReset(true)}>전체 초기화</button>
        ) : (
          <div className="reset-confirm" role="alert">
            <span>입력과 최근 비교를 모두 지울까요?</span>
            <button type="button" onClick={() => setConfirmingReset(false)}>취소</button>
            <button className="danger-button" type="button" onClick={onReset}>모두 지우기</button>
          </div>
        )}
      </div>
    </section>
  );
}

function HistoryItem({ item }: { item: ComparisonResult }) {
  const winner = item.rankedMethods[0];
  return (
    <li>
      <span>{new Date(item.calculatedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      <strong>{METHOD_NAMES[winner.methodId]}</strong>
      <span>{krw.format(item.input.purchaseAmountJpy)} JPY</span>
      <b>{krw.format(Math.round(winner.effectiveCostKrw))}원</b>
    </li>
  );
}
