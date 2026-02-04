import { formatCurrency, safeParseJsonArray } from './formatters';

describe('formatCurrency', () => {
  it('formats integer amounts without cents', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
  });

  it('formats with cents when requested', () => {
    expect(formatCurrency(1234.56, { showCents: true })).toBe('$1,234.56');
  });

  it('handles null/undefined', () => {
    expect(formatCurrency(null)).toBe('$0');
    expect(formatCurrency(undefined)).toBe('$0');
  });
});

describe('safeParseJsonArray', () => {
  it('parses valid JSON array string', () => {
    expect(safeParseJsonArray('[1, 2, 3]')).toEqual([1, 2, 3]);
  });

  it('returns input if already array', () => {
    expect(safeParseJsonArray([1, 2])).toEqual([1, 2]);
  });

  it('returns empty array for invalid input', () => {
    expect(safeParseJsonArray('not json')).toEqual([]);
    expect(safeParseJsonArray(null)).toEqual([]);
  });
});
