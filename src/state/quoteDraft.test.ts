import { describe, expect, it } from 'vitest';
import { createDefaultDraft, draftToInput, isRateStale } from './quoteDraft';

describe('quote draft rate timestamps', () => {
  it('keeps timestamps only for rates used by the calculation', () => {
    const draft = {
      ...createDefaultDraft(),
      naverKrwPer100Jpy: '',
      shinhanKrwPer100Jpy: '910',
      naverRateUpdatedAt: '2026-06-19T00:00:00.000Z',
      shinhanRateUpdatedAt: '2026-06-19T01:00:00.000Z',
    };
    const input = draftToInput(draft);

    expect(input.rateTimestamps?.naverKrwPer100Jpy).toBeUndefined();
    expect(input.rateTimestamps?.shinhanKrwPer100Jpy).toBe('2026-06-19T01:00:00.000Z');
  });

  it('detects a timestamp older than 24 hours', () => {
    const now = Date.parse('2026-06-20T00:00:00.001Z');
    expect(isRateStale('2026-06-19T00:00:00.000Z', now)).toBe(true);
    expect(isRateStale('2026-06-19T00:00:00.001Z', now)).toBe(false);
  });
});
