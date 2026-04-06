import { describe, expect, it } from 'vitest';

import { matchLeaning } from './match-leaning.ts';

describe('matchLeaning', () => {
  it('returns ideology-labels method when ideology texts match', () => {
    const result = matchLeaning(
      ['socialist ideology', 'labour movement'],
      'Unknown Party'
    );
    expect(result.method).toBe('ideology-labels');
    expect(result.leaning).toBe('left');
    expect(result.matched.length).toBeGreaterThan(0);
  });

  it('falls back to party-label-regex when ideology texts are empty', () => {
    const result = matchLeaning([], 'Conservative Party');
    expect(result.method).toBe('party-label-regex');
    expect(result.leaning).toBe('right');
  });

  it('falls back to party-label-regex for left via label', () => {
    const result = matchLeaning([], 'Labour Party');
    expect(result.method).toBe('party-label-regex');
    expect(result.leaning).toBe('left');
  });

  it('falls back to party-label-regex for center via label', () => {
    const result = matchLeaning([], 'Liberal Democrats');
    expect(result.method).toBe('party-label-regex');
    expect(result.leaning).toBe('center');
  });

  it('returns fallback center when no ideology or label match', () => {
    const result = matchLeaning([], 'Unknownia Independence Party Xyz');
    expect(result.method).toBe('fallback');
    expect(result.leaning).toBe('center');
    expect(result.matched).toHaveLength(0);
  });

  it('picks leaning with most ideology matches when multiple match', () => {
    // Right has more matches: conservative + unionist + nationalist
    const result = matchLeaning(
      ['conservative ideology', 'unionist party', 'nationalist group'],
      'SomeName'
    );
    expect(result.leaning).toBe('right');
    expect(result.method).toBe('ideology-labels');
  });
});
