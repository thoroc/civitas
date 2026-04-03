import { describe, expect, it } from 'vitest';

import { collectMatches } from './collectMatches.ts';

describe('collectMatches', () => {
  it('matches left-leaning keywords', () => {
    expect(collectMatches('left', 'labour party')).not.toHaveLength(0);
    expect(collectMatches('left', 'socialist movement')).not.toHaveLength(0);
    expect(collectMatches('left', 'green party')).not.toHaveLength(0);
  });

  it('matches right-leaning keywords', () => {
    expect(collectMatches('right', 'conservative party')).not.toHaveLength(0);
    expect(collectMatches('right', 'ukip')).not.toHaveLength(0);
    expect(collectMatches('right', 'unionist')).not.toHaveLength(0);
  });

  it('matches center-leaning keywords', () => {
    expect(collectMatches('center', 'liberal democrats')).not.toHaveLength(0);
    expect(collectMatches('center', 'centrist alliance')).not.toHaveLength(0);
  });

  it('returns empty array for no matches', () => {
    expect(collectMatches('left', 'xyz party')).toHaveLength(0);
    expect(collectMatches('right', 'green ecology')).toHaveLength(0);
  });

  it('returns regex source strings for matched patterns', () => {
    const matches = collectMatches('left', 'labour party');
    expect(matches.every(m => typeof m === 'string')).toBe(true);
  });

  it('returns multiple matches when source matches multiple patterns', () => {
    // "progressive socialist" should match both /progressive/ and /socialist/
    const matches = collectMatches('left', 'progressive socialist');
    expect(matches.length).toBeGreaterThan(1);
  });
});
