import { describe, expect, it } from 'vitest';

import { validateSpells } from './validation.ts';

describe('validateSpells', () => {
  it('returns empty report for valid non-overlapping adjacent spells', () => {
    const report = validateSpells([
      { memberId: 1, start: '2010-01-01', end: '2015-07-01' },
      { memberId: 1, start: '2015-07-01', end: '2020-01-01' },
    ]);
    expect(report.overlaps).toHaveLength(0);
    expect(report.negatives).toHaveLength(0);
    expect(report.gaps).toHaveLength(0);
  });

  it('detects a negative spell (end before start)', () => {
    const report = validateSpells([
      { memberId: 2, start: '2015-01-01', end: '2014-01-01' },
    ]);
    expect(report.negatives).toHaveLength(1);
    expect(report.negatives[0]).toContain('member=2');
  });

  it('detects an overlap when previous spell has no end', () => {
    const report = validateSpells([
      { memberId: 3, start: '2010-01-01' },
      { memberId: 3, start: '2015-01-01', end: '2020-01-01' },
    ]);
    expect(report.overlaps).toHaveLength(1);
    expect(report.overlaps[0]).toContain('member=3');
  });

  it('detects an overlap when previous end is after next start', () => {
    const report = validateSpells([
      { memberId: 4, start: '2010-01-01', end: '2016-01-01' },
      { memberId: 4, start: '2015-01-01', end: '2020-01-01' },
    ]);
    expect(report.overlaps).toHaveLength(1);
  });

  it('detects a gap between consecutive spells', () => {
    const report = validateSpells([
      { memberId: 5, start: '2010-01-01', end: '2015-01-01' },
      { memberId: 5, start: '2016-01-01', end: '2020-01-01' },
    ]);
    expect(report.gaps).toHaveLength(1);
    expect(report.gaps[0]).toContain('member=5');
    expect(report.gaps[0]).toContain('days=');
  });

  it('handles empty input', () => {
    const report = validateSpells([]);
    expect(report.overlaps).toHaveLength(0);
    expect(report.negatives).toHaveLength(0);
    expect(report.gaps).toHaveLength(0);
  });

  it('handles a single spell per member with no end', () => {
    const report = validateSpells([{ memberId: 6, start: '2020-01-01' }]);
    expect(report.overlaps).toHaveLength(0);
    expect(report.negatives).toHaveLength(0);
    expect(report.gaps).toHaveLength(0);
  });

  it('handles multiple members independently', () => {
    const report = validateSpells([
      { memberId: 1, start: '2010-01-01', end: '2015-01-01' },
      { memberId: 2, start: '2010-01-01', end: '2015-01-01' },
      { memberId: 1, start: '2015-01-01', end: '2020-01-01' },
      { memberId: 2, start: '2014-01-01', end: '2020-01-01' }, // overlap for member 2
    ]);
    expect(report.overlaps).toHaveLength(1);
    expect(report.overlaps[0]).toContain('member=2');
  });

  it('sorts spells by start before checking', () => {
    // Provided out of order — should still detect gap correctly
    const report = validateSpells([
      { memberId: 7, start: '2016-01-01', end: '2020-01-01' },
      { memberId: 7, start: '2010-01-01', end: '2015-01-01' },
    ]);
    expect(report.gaps).toHaveLength(1);
    expect(report.overlaps).toHaveLength(0);
  });
});
