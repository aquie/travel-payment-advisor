import type { ComparisonResult } from '../domain/types';
import { validateQuoteInput } from '../domain/engine';
import { METHOD_ORDER } from '../domain/rules';
import { createDefaultDraft, type QuoteDraft } from '../state/quoteDraft';

export const STORAGE_KEY = 'travel-payment-advisor:v1';
export const SCHEMA_VERSION = 1;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY = 30;

export type StoredDocument = {
  schemaVersion: typeof SCHEMA_VERSION;
  lastDraft: QuoteDraft;
  recentComparisons: ComparisonResult[];
};

export type LoadResult = {
  document: StoredDocument;
  recoveredFromError: boolean;
};

export function createEmptyDocument(): StoredDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    lastDraft: createDefaultDraft(),
    recentComparisons: [],
  };
}

export function pruneHistory(
  history: ComparisonResult[],
  now = Date.now(),
): ComparisonResult[] {
  return history
    .filter((item) => {
      const timestamp = Date.parse(item.calculatedAt);
      return Number.isFinite(timestamp) && now - timestamp <= RETENTION_MS;
    })
    .sort((a, b) => Date.parse(b.calculatedAt) - Date.parse(a.calculatedAt))
    .slice(0, MAX_HISTORY);
}

function isStoredDocument(value: unknown): value is StoredDocument {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredDocument>;
  return candidate.schemaVersion === SCHEMA_VERSION &&
    isQuoteDraft(candidate.lastDraft) &&
    Array.isArray(candidate.recentComparisons) &&
    candidate.recentComparisons.every(isComparisonResult);
}

function isQuoteDraft(value: unknown): value is QuoteDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  const stringFields = [
    'quoteDate', 'purchaseAmountJpy', 'commonKrwPer100Jpy', 'usdKrw',
    'naverKrwPer100Jpy', 'shinhanKrwPer100Jpy', 'naverCashbackRemainingKrw',
    'shinhanOverseasSpendThisMonthKrw',
  ];
  return stringFields.every((field) => typeof draft[field] === 'string') &&
    typeof draft.naverEventApplied === 'boolean' &&
    typeof draft.shinhanPreviousMonthEligible === 'boolean' &&
    [10, 15, 20].includes(draft.asianaMileValueKrw as number) &&
    ['rateUpdatedAt', 'usdRateUpdatedAt', 'naverRateUpdatedAt', 'shinhanRateUpdatedAt']
      .every((field) => draft[field] === undefined || typeof draft[field] === 'string');
}

function isComparisonResult(value: unknown): value is ComparisonResult {
  if (!value || typeof value !== 'object') return false;
  const comparison = value as Partial<ComparisonResult>;
  if (typeof comparison.calculatedAt !== 'string' || !Number.isFinite(Date.parse(comparison.calculatedAt)) ||
    !comparison.input || !Array.isArray(comparison.rankedMethods) ||
    comparison.rankedMethods.length !== METHOD_ORDER.length ||
    typeof comparison.isCloseCall !== 'boolean') return false;
  try {
    validateQuoteInput(comparison.input);
  } catch {
    return false;
  }
  const seen = new Set<string>();
  return comparison.rankedMethods.every((method) => {
    if (!method || !METHOD_ORDER.includes(method.methodId) || seen.has(method.methodId)) return false;
    seen.add(method.methodId);
    return ['convertedKrw', 'percentageFeesKrw', 'fixedFeesKrw', 'cashbackKrw',
      'earnedMiles', 'mileageValueKrw', 'effectiveCostKrw']
      .every((field) => Number.isFinite(method[field as keyof typeof method])) &&
      Array.isArray(method.assumptions) && method.assumptions.every((item) => typeof item === 'string') &&
      Array.isArray(method.warnings) && method.warnings.every((item) => typeof item === 'string');
  });
}

function write(document: StoredDocument): StoredDocument {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  } catch {
    // Storage can be unavailable in private or quota-constrained contexts.
  }
  return document;
}

export function loadStoredState(now = Date.now()): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { document: createEmptyDocument(), recoveredFromError: true };
  }
  if (!raw) return { document: createEmptyDocument(), recoveredFromError: false };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredDocument(parsed)) throw new Error('unsupported schema');
    const document = { ...parsed, recentComparisons: pruneHistory(parsed.recentComparisons, now) };
    write(document);
    return { document, recoveredFromError: false };
  } catch {
    const document = createEmptyDocument();
    write(document);
    return { document, recoveredFromError: true };
  }
}

export function saveDraft(draft: QuoteDraft): StoredDocument {
  const current = loadStoredState().document;
  return write({ ...current, lastDraft: draft });
}

export function saveComparison(
  draft: QuoteDraft,
  comparison: ComparisonResult,
  now = Date.now(),
): StoredDocument {
  const current = loadStoredState(now).document;
  const recentComparisons = pruneHistory(
    [comparison, ...current.recentComparisons.filter((item) => item.calculatedAt !== comparison.calculatedAt)],
    now,
  );
  return write({ ...current, lastDraft: draft, recentComparisons });
}

export function resetStoredData(): StoredDocument {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Keep the in-memory reset usable even when browser storage is blocked.
  }
  return createEmptyDocument();
}

export function createExportJson(document: StoredDocument): string {
  return JSON.stringify(document, null, 2);
}
