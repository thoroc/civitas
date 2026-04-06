import { describe, expect, it } from 'vitest';

import { resolveLeaningForParty } from './resolve-leaning-for-party.ts';

describe('resolveLeaningForParty', () => {
  const ideologyMap = new Map([['Q1', ['socialist party', 'labour movement']]]);

  it('uses override leaning when override is present', () => {
    const result = resolveLeaningForParty({
      qid: 'Q1',
      partyLabel: 'Conservative',
      override: { leaning: 'right' },
      ideologyMap,
    });
    expect(result.leaning).toBe('right');
    expect(result.method).toBe('override');
    expect(result.matched).toHaveLength(0);
  });

  it('uses ideology map via matchLeaning when no override', () => {
    const result = resolveLeaningForParty({
      qid: 'Q1',
      partyLabel: 'Some Party',
      override: undefined,
      ideologyMap,
    });
    expect(result.leaning).toBe('left');
    expect(result.method).not.toBe('override');
  });

  it('falls back to label matching when qid has no ideology entries', () => {
    const result = resolveLeaningForParty({
      qid: 'Q999',
      partyLabel: 'Conservative Party',
      override: undefined,
      ideologyMap,
    });
    expect(result.leaning).toBe('right');
  });

  it('handles undefined qid gracefully', () => {
    const result = resolveLeaningForParty({
      qid: undefined,
      partyLabel: 'Green Party',
      override: undefined,
      ideologyMap,
    });
    expect(result.leaning).toBe('left');
    expect(result.method).toBe('party-label-regex');
  });

  it('returns override leaning even when ideologies would differ', () => {
    const result = resolveLeaningForParty({
      qid: 'Q1', // has left ideologies
      partyLabel: 'Some Party',
      override: { leaning: 'center' },
      ideologyMap,
    });
    expect(result.leaning).toBe('center');
  });
});
