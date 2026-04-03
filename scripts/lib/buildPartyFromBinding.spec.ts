import { describe, expect, it } from 'vitest';

import { buildPartyFromBinding } from './buildPartyFromBinding.ts';

const WD = 'http://www.wikidata.org/entity/';

describe('buildPartyFromBinding', () => {
  it('returns null when neither partyText nor party binding is present', () => {
    expect(buildPartyFromBinding({})).toBeNull();
  });

  it('returns null when partyText has no value', () => {
    expect(buildPartyFromBinding({ partyText: undefined })).toBeNull();
  });

  it('builds a party from partyText binding', () => {
    const party = buildPartyFromBinding({
      partyText: { value: `${WD}Q9630` },
      partyLabel: { value: 'Labour Party' },
      rgb: { value: 'E4003B' },
    });
    expect(party).toEqual({
      id: 'Q9630',
      label: 'Labour Party',
      color: '#E4003B',
    });
  });

  it('falls back to party binding when partyText is absent', () => {
    const party = buildPartyFromBinding({
      party: { value: `${WD}Q273676` },
      partyLabel: { value: 'Conservative Party' },
      rgb: { value: '0087DC' },
    });
    expect(party?.id).toBe('Q273676');
  });

  it('uses party URI as label when partyLabel is absent', () => {
    const party = buildPartyFromBinding({
      partyText: { value: `${WD}Q42` },
    });
    expect(party?.label).toBe('Q42');
  });

  it('defaults color to #808080 when rgb is absent', () => {
    const party = buildPartyFromBinding({
      partyText: { value: `${WD}Q1` },
    });
    expect(party?.color).toBe('#808080');
  });

  it('strips Wikidata prefix from id', () => {
    const party = buildPartyFromBinding({
      partyText: { value: `${WD}Q999` },
    });
    expect(party?.id).toBe('Q999');
  });
});
