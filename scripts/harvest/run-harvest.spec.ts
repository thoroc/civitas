import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  harvestMembers: vi.fn(),
  normalize: vi.fn(),
  parseNormalized: vi.fn(),
  harvestOData: vi.fn(),
}));

vi.mock('./members-api-client.ts', () => ({
  harvestMembers: mocks.harvestMembers,
}));
vi.mock('./normalize.ts', () => ({ normalize: mocks.normalize }));
vi.mock('./schemas.ts', () => ({
  NormalizedDataSchema: { parse: mocks.parseNormalized },
}));
vi.mock('./odata-harvester.ts', () => ({
  harvestOData: mocks.harvestOData,
}));

import { runHarvest } from './run-harvest.ts';

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

const HARVEST = {
  members: [{ id: 'Q1' }],
  partySpells: [{}],
  seatSpells: [{}],
};
const NORMALIZED = {
  parties: [],
  constituencies: [],
  partySpells: [],
  seatSpells: [],
};

describe('runHarvest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.harvestMembers.mockResolvedValue(HARVEST);
    mocks.normalize.mockReturnValue(NORMALIZED);
  });

  it('returns normalized data', async () => {
    const result = await runHarvest(BASE_CFG);
    expect(result).toBe(NORMALIZED);
  });

  it('calls harvestMembers when source is membersApi', async () => {
    await runHarvest(BASE_CFG);

    expect(mocks.harvestMembers).toHaveBeenCalledWith(BASE_CFG);
    expect(mocks.harvestOData).not.toHaveBeenCalled();
  });

  it('calls harvestOData when source is odata', async () => {
    mocks.harvestOData.mockResolvedValue(HARVEST);

    await runHarvest({ ...BASE_CFG, source: 'odata' });

    expect(mocks.harvestOData).toHaveBeenCalled();
    expect(mocks.harvestMembers).not.toHaveBeenCalled();
  });

  it('passes harvest result and cfg to normalize', async () => {
    await runHarvest(BASE_CFG);

    expect(mocks.normalize).toHaveBeenCalledWith(HARVEST, BASE_CFG);
  });

  it('validates normalized data via NormalizedDataSchema.parse', async () => {
    await runHarvest(BASE_CFG);

    expect(mocks.parseNormalized).toHaveBeenCalledWith(NORMALIZED);
  });

  it('continues when NormalizedDataSchema.parse throws', async () => {
    mocks.parseNormalized.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(runHarvest(BASE_CFG)).resolves.toBe(NORMALIZED);
  });
});
