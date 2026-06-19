import type { ComparisonResult } from '../domain/types';
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
    Boolean(candidate.lastDraft && typeof candidate.lastDraft === 'object') &&
    Array.isArray(candidate.recentComparisons);
}

function write(document: StoredDocument): StoredDocument {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  return document;
}

export function loadStoredState(now = Date.now()): LoadResult {
  const raw = localStorage.getItem(STORAGE_KEY);
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
  localStorage.removeItem(STORAGE_KEY);
  return createEmptyDocument();
}

export function createExportJson(document: StoredDocument): string {
  return JSON.stringify(document, null, 2);
}
