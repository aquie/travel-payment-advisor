import { useState } from 'react';
import { comparePaymentMethods } from './domain/engine';
import type { ComparisonResult, QuoteInput } from './domain/types';
import { OfficialSources } from './components/OfficialSources';
import { DataManagement } from './components/DataManagement';
import { QuoteForm } from './components/QuoteForm';
import { Recommendation } from './components/Recommendation';
import { createDefaultDraft, type QuoteDraft } from './state/quoteDraft';
import {
  loadStoredState,
  resetStoredData,
  saveComparison,
  saveDraft,
  type StoredDocument,
} from './storage/localStore';

export default function App() {
  const [initialLoad] = useState(loadStoredState);
  const [draft, setDraft] = useState<QuoteDraft>(initialLoad.document.lastDraft);
  const [storedDocument, setStoredDocument] = useState<StoredDocument>(initialLoad.document);
  const [result, setResult] = useState<ComparisonResult>();
  const [error, setError] = useState<string>();

  const updateDraft = (update: (current: QuoteDraft) => QuoteDraft) => {
    setDraft((current) => {
      const nextDraft = update(current);
      setStoredDocument(saveDraft(nextDraft));
      return nextDraft;
    });
  };

  const compare = (input: QuoteInput) => {
    try {
      const nextResult = comparePaymentMethods(input);
      setResult(nextResult);
      setStoredDocument(saveComparison(draft, nextResult));
      setError(undefined);
      requestAnimationFrame(() => document.getElementById('result-heading')?.focus({ preventScroll: true }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '입력값을 다시 확인해 주세요.');
    }
  };

  const reset = () => {
    const empty = resetStoredData();
    setDraft(createDefaultDraft());
    setStoredDocument(empty);
    setResult(undefined);
    setError(undefined);
  };

  return (
    <>
      <header className="app-header">
        <a className="brand" href="#top">어떻게 결제할까?</a>
        <a className="header-link" href="#official-sources">공식 조건</a>
      </header>
      <main id="top" className="app-shell">
        <section className="intro">
          <h1>어떻게 결제할까?</h1>
          <p>일본 결제비용을 한눈에 비교해요</p>
          <span>환율과 비교 기록은 이 기기에만 저장됩니다.</span>
        </section>
        {initialLoad.recoveredFromError ? (
          <p className="recovery-notice" role="status">저장 데이터를 읽지 못해 안전한 기본값으로 초기화했습니다.</p>
        ) : null}

        <div className="workspace">
          <section className="input-section" aria-labelledby="input-heading">
            <h2 id="input-heading" className="sr-only">결제 정보 입력</h2>
            <QuoteForm draft={draft} error={error} onDraftChange={updateDraft} onCompare={compare} />
          </section>
          {result ? <Recommendation result={result} /> : (
            <section className="empty-result" aria-label="비교 안내">
              <span aria-hidden="true">¥</span>
              <h2>직접 확인한 환율을 입력해 주세요.</h2>
              <p>네 결제수단의 수수료·혜택·마일 가치를 같은 기준으로 비교합니다.</p>
            </section>
          )}
        </div>

        <DataManagement document={storedDocument} onReset={reset} />
        <OfficialSources />
        <aside className="disclaimer">
          이 결과는 의사결정용 예상치이며 실제 승인·매입 환율과 청구액을 보장하지 않습니다.
        </aside>
      </main>
    </>
  );
}
