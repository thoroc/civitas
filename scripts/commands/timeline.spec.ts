import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runHarvest: vi.fn(),
  reportValidation: vi.fn(),
  validateSpells: vi.fn(),
  buildEventsAndSnapshots: vi.fn(),
  writeTimelineOutput: vi.fn(),
  parseSchema: vi.fn(),
}));

vi.mock('../lib/runHarvest.ts', () => ({ runHarvest: mocks.runHarvest }));
vi.mock('../lib/reportValidation.ts', () => ({
  reportValidation: mocks.reportValidation,
}));
vi.mock('../lib/validation.ts', () => ({
  validateSpells: mocks.validateSpells,
}));
vi.mock('../lib/buildEventsAndSnapshots.ts', () => ({
  buildEventsAndSnapshots: mocks.buildEventsAndSnapshots,
}));
vi.mock('../lib/writeTimelineOutput.ts', () => ({
  writeTimelineOutput: mocks.writeTimelineOutput,
}));
vi.mock('../harvest/schemas.ts', () => ({
  HarvestConfigSchema: { parse: mocks.parseSchema },
}));

import { runTimeline } from './timeline.ts';

const BASE_OPTS = {
  since: '2005-01-01',
  granularity: 'events' as const,
  mergeLabourCoop: false,
  forceRefresh: false,
  maxConcurrency: 6,
  cacheDir: '.cache',
  source: 'membersApi' as const,
};

const NORMALIZED = {
  partySpells: [],
  seatSpells: [],
};

describe('runTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.parseSchema.mockReturnValue(undefined); // valid config
    mocks.runHarvest.mockResolvedValue(NORMALIZED);
    mocks.validateSpells.mockReturnValue({
      overlaps: [],
      negatives: [],
      gaps: [],
    });
    mocks.buildEventsAndSnapshots.mockReturnValue({
      events: [],
      snapshots: [],
    });
    mocks.writeTimelineOutput.mockReturnValue(undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('runs the full pipeline on valid config', async () => {
    await runTimeline(BASE_OPTS);

    expect(mocks.runHarvest).toHaveBeenCalledTimes(1);
    expect(mocks.reportValidation).toHaveBeenCalledTimes(1);
    expect(mocks.buildEventsAndSnapshots).toHaveBeenCalledTimes(1);
    expect(mocks.writeTimelineOutput).toHaveBeenCalledTimes(1);
  });

  it('calls process.exit(1) when config validation fails', async () => {
    mocks.parseSchema.mockImplementation(() => {
      throw new Error('invalid');
    });
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(runTimeline(BASE_OPTS)).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('passes cfg with correct fields to runHarvest', async () => {
    await runTimeline({
      ...BASE_OPTS,
      since: '2010-01-01',
      granularity: 'monthly',
    });

    expect(mocks.runHarvest).toHaveBeenCalledWith(
      expect.objectContaining({ since: '2010-01-01', granularity: 'monthly' })
    );
  });

  it('calls validateSpells for both party and seat spells', async () => {
    const normalized = {
      partySpells: [{ memberId: 1, start: 'a' }],
      seatSpells: [{ memberId: 2, start: 'b' }],
    };
    mocks.runHarvest.mockResolvedValueOnce(normalized);

    await runTimeline(BASE_OPTS);

    expect(mocks.validateSpells).toHaveBeenCalledWith(normalized.partySpells);
    expect(mocks.validateSpells).toHaveBeenCalledWith(normalized.seatSpells);
  });

  it('passes normalized data and cfg to buildEventsAndSnapshots', async () => {
    await runTimeline(BASE_OPTS);
    expect(mocks.buildEventsAndSnapshots).toHaveBeenCalledWith(
      NORMALIZED,
      expect.objectContaining({ since: '2005-01-01' })
    );
  });

  it('passes snapshots and events to writeTimelineOutput', async () => {
    const events = [{ type: 'join' }];
    const snapshots = [{ date: '2021-01-01' }];
    mocks.buildEventsAndSnapshots.mockReturnValueOnce({ events, snapshots });

    await runTimeline(BASE_OPTS);

    expect(mocks.writeTimelineOutput).toHaveBeenCalledWith(snapshots, events);
  });
});
