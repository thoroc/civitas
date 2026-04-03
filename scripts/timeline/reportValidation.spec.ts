import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { reportValidation } from './reportValidation.ts';

const empty = { overlaps: [], negatives: [], gaps: [] };

describe('reportValidation', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('does nothing when both reports are clean', () => {
    reportValidation(empty, empty);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('logs summary when party overlaps exist', () => {
    reportValidation({ ...empty, overlaps: ['overlap member=1'] }, empty);
    expect(console.warn).toHaveBeenCalled();
  });

  it('logs summary when seat negatives exist', () => {
    reportValidation(empty, { ...empty, negatives: ['neg member=2'] });
    expect(console.warn).toHaveBeenCalled();
  });

  it('logs sample items from each non-empty bucket', () => {
    const partyReport = {
      overlaps: ['o1', 'o2'],
      negatives: ['n1'],
      gaps: [],
    };
    reportValidation(partyReport, empty);
    const calls = (console.warn as ReturnType<typeof vi.fn>).mock.calls
      .flat()
      .join(' ');
    expect(calls).toContain('overlaps=2');
    expect(calls).toContain('negatives=1');
  });

  it('truncates sample to 10 items and shows ellipsis', () => {
    const manyOverlaps = Array.from({ length: 15 }, (_, i) => `overlap ${i}`);
    reportValidation(
      { overlaps: manyOverlaps, negatives: [], gaps: [] },
      empty
    );
    const calls = (console.warn as ReturnType<typeof vi.fn>).mock.calls
      .flat()
      .join(' ');
    expect(calls).toContain('...');
  });

  it('logs seat gaps', () => {
    reportValidation(empty, { ...empty, gaps: ['gap member=3'] });
    const calls = (console.warn as ReturnType<typeof vi.fn>).mock.calls
      .flat()
      .join(' ');
    expect(calls).toContain('gaps=1');
  });
});
