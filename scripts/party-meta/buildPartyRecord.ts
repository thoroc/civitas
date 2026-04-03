import { isQID } from './isQID.ts';
import { spectrumMap } from './keywords.ts';
import { resolveLeaningForParty } from './resolveLeaningForParty.ts';
import type { PartyEntry, PartyMetaRecord } from './types.ts';

interface BuildPartyRecordArgs {
  party: PartyEntry;
  ideologyMap: Map<string, string[]>;
  overrides: Record<string, Partial<PartyMetaRecord>>;
  now: string;
}

export const buildPartyRecord = (
  args: BuildPartyRecordArgs
): PartyMetaRecord => {
  const { party: p, ideologyMap, overrides, now } = args;
  const qid: string | undefined =
    p.resolvedQid || (isQID(p.id) ? p.id : undefined);
  const override = overrides[p.id] || (qid ? overrides[qid] : undefined);

  const { leaning, matched, method } = resolveLeaningForParty({
    qid,
    partyLabel: p.label,
    override,
    ideologyMap,
  });

  const rec: PartyMetaRecord = {
    id: qid || p.id,
    originalSnapshotId: p.id,
    qidResolved: Boolean(qid),
    label: p.label,
    color: p.color,
    leaning,
    spectrumPosition: spectrumMap[leaning],
    source: {
      ideologies: qid ? ideologyMap.get(qid) || [] : [],
      matched,
      method,
      generatedAt: now,
    },
  };

  if (override?.label) rec.label = override.label;
  const overrideAny = override as Record<string, unknown> | undefined;
  if (overrideAny?.spectrumPosition !== undefined) {
    rec.spectrumPosition = overrideAny.spectrumPosition as number;
  }

  return rec;
};
