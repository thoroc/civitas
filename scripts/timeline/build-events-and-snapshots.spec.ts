import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  buildEvents: vi.fn(),
  buildSnapshots: vi.fn(),
  parseEvent: vi.fn(),
  parseSnapshot: vi.fn(),
  fetchWikidataEventTypeLookup: vi.fn(),
}));

vi.mock('../harvest/build-events.ts', () => ({
  buildEvents: mocks.buildEvents,
}));
vi.mock('../harvest/build-snapshots.ts', () => ({
  buildSnapshots: mocks.buildSnapshots,
}));
vi.mock('../harvest/schemas.ts', () => ({
  EventSchema: { parse: mocks.parseEvent },
  SnapshotSchema: { parse: mocks.parseSnapshot },
}));
vi.mock('../harvest/event-type.ts', () => ({
  fetchWikidataEventTypeLookup: mocks.fetchWikidataEventTypeLookup,
}));

import { buildEventsAndSnapshots } from './build-events-and-snapshots.ts';

const BASE_CFG = {
  since: '2010-01-01',
  granularity: 'events' as const,
  mergeLabourCoop: false,
  forceRefresh: false,
  maxConcurrency: 4,
  cacheDir: '.cache',
  source: 'membersApi' as const,
  partyAliases: {} as Record<string, string>,
};

const NORMALIZED = {
  partySpells: [],
  seatSpells: [],
  parties: [],
  constituencies: [],
};

describe('buildEventsAndSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildEvents.mockReturnValue([]);
    mocks.buildSnapshots.mockReturnValue([]);
    mocks.fetchWikidataEventTypeLookup.mockResolvedValue({
      general: new Set(),
      byElection: new Set(),
    });
  });

  it('returns events and snapshots from builders', async () => {
    const events = [{ type: 'join' }];
    const snapshots = [{ date: '2021-01-01' }];
    mocks.buildEvents.mockReturnValue(events);
    mocks.buildSnapshots.mockReturnValue(snapshots);

    const result = await buildEventsAndSnapshots(NORMALIZED as never, BASE_CFG);

    expect(result.events).toBe(events);
    expect(result.snapshots).toBe(snapshots);
  });

  it('passes normalized and cfg to buildEvents', async () => {
    await buildEventsAndSnapshots(NORMALIZED as never, BASE_CFG);

    expect(mocks.buildEvents).toHaveBeenCalledWith(NORMALIZED, BASE_CFG);
  });

  it('passes monthly=false when granularity is "events"', async () => {
    await buildEventsAndSnapshots(NORMALIZED as never, {
      ...BASE_CFG,
      granularity: 'events',
    });

    expect(mocks.buildSnapshots).toHaveBeenCalledWith(
      NORMALIZED,
      expect.anything(),
      expect.objectContaining({ monthly: false })
    );
  });

  it('passes monthly=true when granularity is "monthly"', async () => {
    await buildEventsAndSnapshots(NORMALIZED as never, {
      ...BASE_CFG,
      granularity: 'monthly',
    });

    expect(mocks.buildSnapshots).toHaveBeenCalledWith(
      NORMALIZED,
      expect.anything(),
      expect.objectContaining({ monthly: true })
    );
  });

  it('validates each event via EventSchema.parse', async () => {
    const events = [{ type: 'join' }, { type: 'leave' }];
    mocks.buildEvents.mockReturnValue(events);

    await buildEventsAndSnapshots(NORMALIZED as never, BASE_CFG);

    expect(mocks.parseEvent).toHaveBeenCalledTimes(2);
  });

  it('validates each snapshot via SnapshotSchema.parse', async () => {
    const snapshots = [{ date: '2021-01-01' }, { date: '2022-01-01' }];
    mocks.buildSnapshots.mockReturnValue(snapshots);

    await buildEventsAndSnapshots(NORMALIZED as never, BASE_CFG);

    expect(mocks.parseSnapshot).toHaveBeenCalledTimes(2);
  });

  it('continues when EventSchema.parse throws', async () => {
    mocks.buildEvents.mockReturnValue([{ type: 'bad' }]);
    mocks.parseEvent.mockImplementation(() => {
      throw new Error('invalid event');
    });

    await expect(
      buildEventsAndSnapshots(NORMALIZED as never, BASE_CFG)
    ).resolves.not.toThrow();
  });

  it('continues when SnapshotSchema.parse throws', async () => {
    mocks.buildSnapshots.mockReturnValue([{ date: 'bad' }]);
    mocks.parseSnapshot.mockImplementation(() => {
      throw new Error('invalid snapshot');
    });

    await expect(
      buildEventsAndSnapshots(NORMALIZED as never, BASE_CFG)
    ).resolves.not.toThrow();
  });
});
