import { describe, expect, it } from 'vitest';

import { buildPartyRecord } from './build-party-record.ts';
import type { PartyEntry } from './types.ts';

const NOW = '2024-01-01T00:00:00Z';

const makeArgs = (
  party: PartyEntry,
  ideologyMap = new Map<string, string[]>(),
  overrides: Record<string, object> = {}
) => ({ party, ideologyMap, overrides, now: NOW });

describe('buildPartyRecord', () => {
  it('builds a record for a QID-identified party', () => {
    const rec = buildPartyRecord(
      makeArgs({ id: 'Q42', label: 'Labour Party', color: '#E4003B' })
    );
    expect(rec.id).toBe('Q42');
    expect(rec.originalSnapshotId).toBe('Q42');
    expect(rec.qidResolved).toBe(true);
    expect(rec.label).toBe('Labour Party');
    expect(rec.color).toBe('#E4003B');
    expect(rec.source.generatedAt).toBe(NOW);
  });

  it('uses resolvedQid when present, not the raw id', () => {
    const rec = buildPartyRecord(
      makeArgs({
        id: 'lab',
        label: 'Labour',
        color: '#E4003B',
        resolvedQid: 'Q9630',
      })
    );
    expect(rec.id).toBe('Q9630');
    expect(rec.originalSnapshotId).toBe('lab');
    expect(rec.qidResolved).toBe(true);
  });

  it('falls back to id when non-QID and no resolvedQid', () => {
    const rec = buildPartyRecord(
      makeArgs({ id: 'non-qid-party', label: 'Some Party', color: '#aaa' })
    );
    expect(rec.id).toBe('non-qid-party');
    expect(rec.qidResolved).toBe(false);
  });

  it('applies override label', () => {
    const rec = buildPartyRecord(
      makeArgs(
        { id: 'Q1', label: 'Original Label', color: '#000' },
        new Map(),
        { Q1: { leaning: 'left', label: 'Overridden Label' } }
      )
    );
    expect(rec.label).toBe('Overridden Label');
  });

  it('applies override spectrumPosition', () => {
    const rec = buildPartyRecord(
      makeArgs({ id: 'Q1', label: 'Party', color: '#000' }, new Map(), {
        Q1: { leaning: 'center', spectrumPosition: 0.42 },
      })
    );
    expect(rec.spectrumPosition).toBe(0.42);
  });

  it('uses spectrumMap default when no override spectrumPosition', () => {
    const rec = buildPartyRecord(
      makeArgs({ id: 'Q1', label: 'Conservative Party', color: '#009' })
    );
    // conservative → right → 0.75
    expect(rec.spectrumPosition).toBe(0.75);
  });

  it('matches override by QID even when party id is non-QID', () => {
    const rec = buildPartyRecord(
      makeArgs(
        { id: 'lab', label: 'Labour', color: '#red', resolvedQid: 'Q9630' },
        new Map(),
        { Q9630: { leaning: 'right' } } // override via resolved QID
      )
    );
    expect(rec.leaning).toBe('right');
  });

  it('includes ideologies from ideologyMap in source', () => {
    const ideologyMap = new Map([['Q42', ['socialism', 'labour']]]);
    const rec = buildPartyRecord(
      makeArgs({ id: 'Q42', label: 'Labour', color: '#red' }, ideologyMap)
    );
    expect(rec.source.ideologies).toEqual(['socialism', 'labour']);
  });
});
