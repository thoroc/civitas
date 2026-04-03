import { Command } from '@cliffy/command';

import { buildPartyRecord } from '../lib/party-meta/buildPartyRecord.ts';
import { fetchIdeologies } from '../lib/party-meta/fetchIdeologies.ts';
import { isQID } from '../lib/party-meta/isQID.ts';
import { loadOverrides } from '../lib/party-meta/loadOverrides.ts';
import { loadSnapshot } from '../lib/party-meta/loadSnapshot.ts';
import { resolveQids } from '../lib/party-meta/resolveQids.ts';
import type { PartyEntry } from '../lib/party-meta/types.ts';
import { writePartyMeta } from '../lib/party-meta/writePartyMeta.ts';

export type PartyMetaOptions = { snapshot: string };

export const runPartyMeta = async (opts: PartyMetaOptions): Promise<void> => {
  const { snapshot: snapshotPath } = opts;
  console.log(`Reading snapshot: ${snapshotPath}`);
  const snap = loadSnapshot(snapshotPath);

  const partiesMap = new Map<string, { label: string; color: string }>();
  for (const m of snap.members) {
    if (!m.party) continue;
    if (!partiesMap.has(m.party.id)) {
      partiesMap.set(m.party.id, {
        label: m.party.label,
        color: m.party.color,
      });
    }
  }
  const parties: PartyEntry[] = Array.from(partiesMap.entries()).map(
    ([id, v]) => ({
      id,
      label: v.label,
      color: v.color,
    })
  );
  console.log(`Found ${parties.length} unique parties in snapshot.`);

  await resolveQids(parties);

  const qids = parties
    .map(p => p.resolvedQid || (isQID(p.id) ? p.id : null))
    .filter(Boolean) as string[];
  const ideologyMap = await fetchIdeologies(qids);
  const overrides = loadOverrides();
  const now = new Date().toISOString();

  const records = parties.map(party =>
    buildPartyRecord({ party, ideologyMap, overrides, now })
  );

  writePartyMeta(snapshotPath, { generatedAt: now, parties: records });
};

export const partyMetaCommand = new Command()
  .name('party-meta')
  .description(
    'Generate party metadata (ideological leaning) from a parliament snapshot'
  )
  .option(
    '--snapshot <path:string>',
    'Path to an existing parliament snapshot JSON',
    { required: true }
  )
  .action(async opts => {
    await runPartyMeta({ snapshot: opts.snapshot });
  });
