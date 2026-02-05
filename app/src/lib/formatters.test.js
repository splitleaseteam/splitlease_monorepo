import { describe, it, expect } from 'vitest';
import { formatCurrency, safeParseJsonArray, calculateNightlyRate } from './formatters';

describe('formatCurrency', () => {
  it('formats integer amounts without cents by default', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
    expect(formatCurrency(10)).toBe('$10');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats with cents when requested', () => {
    expect(formatCurrency(1234.56, { showCents: true })).toBe('$1,234.56');
    expect(formatCurrency(10.5, { showCents: true })).toBe('$10.50');
  });

  it('handles custom locales', () => {
    const deResult = formatCurrency(1234.56, { locale: 'de-DE', showCents: true });
    expect(deResult).toContain('1.234,56');
  });

  it('handles null/undefined/invalid inputs gracefully', () => {
    expect(formatCurrency(null)).toBe('$0');
    expect(formatCurrency(undefined)).toBe('$0');
    expect(formatCurrency('abc')).toBe('$0');
  });
});

describe('safeParseJsonArray', () => {
  it('parses valid JSON array string', () => {
    expect(safeParseJsonArray('[1, 2, 3]')).toEqual([1, 2, 3]);
    expect(safeParseJsonArray('["a", "b"]')).toEqual(['a', 'b']);
  });

  it('returns input if already array', () => {
    expect(safeParseJsonArray([1, 2])).toEqual([1, 2]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(safeParseJsonArray('not json')).toEqual([]);
    expect(safeParseJsonArray('{ "a": 1 }')).toEqual([]);
  });

  it('returns empty array for null/undefined', () => {
    expect(safeParseJsonArray(null)).toEqual([]);
    expect(safeParseJsonArray(undefined)).toEqual([]);
  });
});

describe('calculateNightlyRate', () => {
  it('calculates rounded nightly rate', () => {
    expect(calculateNightlyRate(700, 7)).toBe(100);
    expect(calculateNightlyRate(1000, 30)).toBe(33);
  });

  it('returns 0 for missing inputs', () => {
    expect(calculateNightlyRate(null, 7)).toBe(0);
    expect(calculateNightlyRate(700, 0)).toBe(0);
  });
});
