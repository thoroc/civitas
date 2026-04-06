import type { Party } from '../../src/app/parliament/types';

type Binding = Record<string, { value: string } | undefined>;

const WIKIDATA_PREFIX = 'http://www.wikidata.org/entity/';

export const buildPartyFromBinding = (binding: Binding): Party | null => {
  const partyEntity = binding.partyText ?? binding.party;
  if (!partyEntity?.value) return null;
  return {
    id: partyEntity.value.replace(WIKIDATA_PREFIX, ''),
    label:
      binding.partyLabel?.value ??
      partyEntity.value.replace(WIKIDATA_PREFIX, ''),
    color: `#${binding.rgb?.value ?? '808080'}`,
  };
};
