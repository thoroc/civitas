import { describe, expect, it } from 'vitest';

import { GENERAL_ELECTIONS } from './elections-baseline.ts';

describe('electionsBaseline', () => {
  it('includes multiple general election dates in ascending order', () => {
    expect(GENERAL_ELECTIONS.length).toBeGreaterThan(0);
    const dates = GENERAL_ELECTIONS.map(e => e.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});
