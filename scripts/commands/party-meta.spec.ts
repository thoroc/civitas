import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadSnapshot: vi.fn(),
  resolveQids: vi.fn(),
  fetchIdeologies: vi.fn(),
  loadOverrides: vi.fn(),
  buildPartyRecord: vi.fn(),
  writePartyMeta: vi.fn(),
  isQID: vi.fn(),
}));

vi.mock('../party-meta/load-snapshot.ts', () => ({
  loadSnapshot: mocks.loadSnapshot,
}));
vi.mock('../party-meta/resolve-qids.ts', () => ({
  resolveQids: mocks.resolveQids,
}));
vi.mock('../party-meta/fetch-ideologies.ts', () => ({
  fetchIdeologies: mocks.fetchIdeologies,
}));
vi.mock('../party-meta/load-overrides.ts', () => ({
  loadOverrides: mocks.loadOverrides,
}));
vi.mock('../party-meta/build-party-record.ts', () => ({
  buildPartyRecord: mocks.buildPartyRecord,
}));
vi.mock('../party-meta/write-party-meta.ts', () => ({
  writePartyMeta: mocks.writePartyMeta,
}));
vi.mock('../party-meta/is-q-i-d.ts', () => ({ isQID: mocks.isQID }));

import { runPartyMeta } from './party-meta.ts';

const makeSnapshot = (
  parties: Array<{ id: string; label: string; color: string }>
) => ({
  members: parties.map(p => ({ party: p })),
});

describe('runPartyMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveQids.mockResolvedValue(undefined);
    mocks.fetchIdeologies.mockResolvedValue(new Map());
    mocks.loadOverrides.mockReturnValue({});
    mocks.buildPartyRecord.mockReturnValue({ id: 'Q1', leaning: 'left' });
    mocks.writePartyMeta.mockReturnValue(undefined);
    mocks.isQID.mockImplementation((s: string) => /^Q\d+$/.test(s));
  });

  it('extracts unique parties from snapshot and calls buildPartyRecord', async () => {
    mocks.loadSnapshot.mockReturnValueOnce(
      makeSnapshot([
        { id: 'Q9630', label: 'Labour', color: '#E4003B' },
        { id: 'Q9630', label: 'Labour', color: '#E4003B' }, // duplicate
        { id: 'Q273676', label: 'Conservative', color: '#0087DC' },
      ])
    );

    await runPartyMeta({ snapshot: '/snap.json' });

    expect(mocks.buildPartyRecord).toHaveBeenCalledTimes(2);
  });

  it('calls writePartyMeta with constructed records', async () => {
    mocks.loadSnapshot.mockReturnValueOnce(
      makeSnapshot([{ id: 'Q1', label: 'Party A', color: '#aaa' }])
    );
    mocks.buildPartyRecord.mockReturnValue({ id: 'Q1', leaning: 'center' });

    await runPartyMeta({ snapshot: '/snap.json' });

    expect(mocks.writePartyMeta).toHaveBeenCalledWith(
      '/snap.json',
      expect.objectContaining({ parties: [{ id: 'Q1', leaning: 'center' }] })
    );
  });

  it('skips members with null party', async () => {
    mocks.loadSnapshot.mockReturnValueOnce({ members: [{ party: null }] });

    await runPartyMeta({ snapshot: '/snap.json' });

    expect(mocks.buildPartyRecord).not.toHaveBeenCalled();
  });

  it('collects QIDs for ideology fetch', async () => {
    mocks.loadSnapshot.mockReturnValueOnce(
      makeSnapshot([{ id: 'Q9630', label: 'Labour', color: '#E4003B' }])
    );
    mocks.isQID.mockReturnValue(true);

    await runPartyMeta({ snapshot: '/snap.json' });

    expect(mocks.fetchIdeologies).toHaveBeenCalledWith(['Q9630']);
  });

  it('calls resolveQids with all parties', async () => {
    mocks.loadSnapshot.mockReturnValueOnce(
      makeSnapshot([{ id: 'lab', label: 'Labour', color: '#red' }])
    );

    await runPartyMeta({ snapshot: '/snap.json' });

    expect(mocks.resolveQids).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'lab' })])
    );
  });
});
