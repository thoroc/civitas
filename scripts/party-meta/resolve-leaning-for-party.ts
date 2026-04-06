import { matchLeaning } from './match-leaning.ts';
import type { Leaning, PartyMetaRecord } from './types.ts';

interface LeaningResolutionArgs {
  qid: string | undefined;
  partyLabel: string;
  override: Partial<PartyMetaRecord> | undefined;
  ideologyMap: Map<string, string[]>;
}

interface LeaningResolution {
  leaning: Leaning;
  matched: string[];
  method: PartyMetaRecord['source']['method'];
}

export const resolveLeaningForParty = (
  args: LeaningResolutionArgs
): LeaningResolution => {
  const { qid, partyLabel, override, ideologyMap } = args;
  if (override?.leaning) {
    return {
      leaning: override.leaning as Leaning,
      matched: [],
      method: 'override',
    };
  }
  const ideologyLabels = qid ? ideologyMap.get(qid) || [] : [];
  const result = matchLeaning(ideologyLabels, partyLabel);
  return {
    leaning: result.leaning,
    matched: result.matched,
    method: result.method,
  };
};
