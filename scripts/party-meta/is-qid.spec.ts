import { describe, expect, it } from 'vitest';

import { isQID } from './is-qid.ts';

describe('isQID', () => {
  it('returns true for valid QID', () => {
    expect(isQID('Q123')).toBe(true);
    expect(isQID('Q1')).toBe(true);
    expect(isQID('Q999999')).toBe(true);
  });

  it('returns true for QID with surrounding whitespace', () => {
    expect(isQID(' Q123 ')).toBe(true);
  });

  it('returns false for non-QID strings', () => {
    expect(isQID('Labour')).toBe(false);
    expect(isQID('Q')).toBe(false);
    expect(isQID('q123')).toBe(false);
    expect(isQID('123')).toBe(false);
    expect(isQID('')).toBe(false);
  });
});
