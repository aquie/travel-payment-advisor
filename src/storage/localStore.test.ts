import { beforeEach, describe, expect, it } from 'vitest';
import { comparePaymentMethods } from '../domain/engine';
import { createDefaultDraft, draftToInput } from '../state/quoteDraft';
import {
  createExportJson,
  loadStoredState,
  pruneHistory,
  resetStoredData,
  saveComparison,
  saveDraft,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from './localStore';

const completeDraft = {
  ...createDefaultDraft(),
  quoteDate: '2026-07-01',
  purchaseAmountJpy: '10000',
  commonKrwPer100Jpy: '900',
  usdKrw: '1400',
};

describe('versioned local storage', () => {
  beforeEach(() => localStorage.clear());

  it('restores the last draft after a reload', () => {
    saveDraft(completeDraft);
    expect(loadStoredState().document.lastDraft.purchaseAmountJpy).toBe('10000');
  });

  it('keeps recent comparisons and removes entries older than seven days', () => {
    const now = Date.parse('2026-06-19T12:00:00.000Z');
    const recent = comparePaymentMethods(draftToInput(completeDraft), '2026-06-18T12:00:00.000Z');
    const old = comparePaymentMethods(draftToInput(completeDraft), '2026-06-11T11:59:59.000Z');
    expect(pruneHistory([old, recent], now)).toEqual([recent]);
  });

  it('saves a comparison without changing benefit balances', () => {
    const result = comparePaymentMethods(draftToInput(completeDraft), '2026-06-19T10:00:00.000Z');
    const stored = saveComparison(completeDraft, result, Date.parse('2026-06-19T10:00:01.000Z'));
    expect(stored.recentComparisons).toHaveLength(1);
    expect(stored.lastDraft.naverCashbackRemainingKrw).toBe('5000');
  });

  it('exports the complete versioned document and reset removes it', () => {
    const stored = saveDraft(completeDraft);
    expect(JSON.parse(createExportJson(stored)).schemaVersion).toBe(SCHEMA_VERSION);
    resetStoredData();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it.each(['not-json', JSON.stringify({ schemaVersion: 999 })])(
    'recovers safely from corrupt or unsupported data: %s',
    (raw) => {
      localStorage.setItem(STORAGE_KEY, raw);
      const loaded = loadStoredState();
      expect(loaded.recoveredFromError).toBe(true);
      expect(loaded.document.schemaVersion).toBe(SCHEMA_VERSION);
    },
  );
});
