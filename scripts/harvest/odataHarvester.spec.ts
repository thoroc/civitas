import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  axiosGet: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: mocks.existsSync,
    mkdirSync: mocks.mkdirSync,
    readFileSync: mocks.readFileSync,
    writeFileSync: mocks.writeFileSync,
  },
}));

vi.mock('axios', () => ({
  default: {
    get: mocks.axiosGet,
  },
}));

import { harvestOData } from './odataHarvester.ts';

describe('odataHarvester', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.existsSync.mockReturnValue(false);
  });

  it('parses Commons membership and collapses contiguous party spells', async () => {
    const xml = `<?xml version="1.0"?>
    <Members>
      <Member Member_Id="1">
        <DisplayAs>Ms Ada</DisplayAs>
        <Party Id="8">Labour</Party>
        <House>Commons</House>
        <MemberFrom>Test Seat</MemberFrom>
        <HouseStartDate>2010-01-01T00:00:00</HouseStartDate>
        <HouseEndDate>2011-01-01T00:00:00</HouseEndDate>
      </Member>
      <Member Member_Id="1">
        <DisplayAs>Ms Ada</DisplayAs>
        <Party Id="8">Labour</Party>
        <House>Commons</House>
        <MemberFrom>Test Seat</MemberFrom>
        <HouseStartDate>2011-01-01T00:00:00</HouseStartDate>
        <HouseEndDate>2012-01-01T00:00:00</HouseEndDate>
      </Member>
      <Member Member_Id="2">
        <DisplayAs>Mr B</DisplayAs>
        <Party Id="9">Other</Party>
        <House>Lords</House>
        <MemberFrom>Other Seat</MemberFrom>
        <HouseStartDate>2010-01-01T00:00:00</HouseStartDate>
      </Member>
    </Members>`;

    mocks.axiosGet.mockResolvedValueOnce({
      status: 200,
      data: xml,
    });

    const cfg = {
      since: '2005-01-01',
      granularity: 'events' as const,
      mergeLabourCoop: false,
      forceRefresh: false,
      maxConcurrency: 4,
      cacheDir: '.cache',
      source: 'odata' as const,
      partyAliases: {},
    };

    const result = await harvestOData(cfg);

    expect(result.members).toHaveLength(1);
    expect(result.seatSpells).toHaveLength(2);
    expect(result.partySpells).toHaveLength(1);
    expect(result.partySpells[0]?.end).toBe('2012-01-01T00:00:00');
  });
});
