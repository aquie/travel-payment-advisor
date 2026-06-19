import { describe, expect, it } from 'vitest';

describe('test environment', () => {
  it('runs TypeScript tests in the configured DOM environment', () => {
    expect(document.documentElement).toBeInstanceOf(HTMLHtmlElement);
  });
});
