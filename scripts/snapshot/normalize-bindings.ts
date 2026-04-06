import { buildConstituencyFromBinding } from './build-constituency-from-binding.ts';
import { buildPartyFromBinding } from './build-party-from-binding.ts';

import type { Member } from '../../src/app/parliament/types';

type Binding = Record<string, { value: string } | undefined>;

const WIKIDATA_PREFIX = 'http://www.wikidata.org/entity/';

const toMember = (b: unknown): Member => {
  const binding = b as Binding;
  return {
    id: binding.mp?.value?.replace(WIKIDATA_PREFIX, '') ?? '',
    label:
      binding.mpLabel?.value ??
      binding.mp?.value?.replace(WIKIDATA_PREFIX, '') ??
      '',
    constituency: buildConstituencyFromBinding(binding),
    party: buildPartyFromBinding(binding),
    gender: binding.genderLabel?.value ?? null,
    age: binding.age?.value ? Number.parseInt(binding.age.value) : null,
  };
};

export const normalizeBindings = (raw: unknown): Member[] => {
  const data = raw as { results?: { bindings?: unknown[] } };
  if (!data?.results?.bindings) {
    console.warn('Unexpected SPARQL structure');
    return [];
  }
  return data.results.bindings.map(toMember);
};
