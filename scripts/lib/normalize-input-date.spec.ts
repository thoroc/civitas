import { afterEach, describe, expect, it, vi } from 'vitest';

import { normalizeInputDate } from './normalize-input-date.ts';

describe('normalizeInputDate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('converts dash time-separator form to ISO colon form', () => {
    expect(normalizeInputDate('2021-01-15T10-30-45Z')).toBe(
      '2021-01-15T10:30:45Z'
    );
  });

  it('leaves already-colon ISO form unchanged', () => {
    expect(normalizeInputDate('2021-01-15T10:30:45Z')).toBe(
      '2021-01-15T10:30:45Z'
    );
  });

  it('handles midnight 00-00-00 correctly', () => {
    expect(normalizeInputDate('2005-05-01T00-00-00Z')).toBe(
      '2005-05-01T00:00:00Z'
    );
  });

  it('calls process.exit(1) on unsupported format', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    expect(() => normalizeInputDate('2021-01-01')).toThrow('process.exit');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('calls process.exit(1) on empty string', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    expect(() => normalizeInputDate('')).toThrow('process.exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
