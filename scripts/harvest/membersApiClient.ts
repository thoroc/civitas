import pLimit from 'p-limit';

import { cachedGet } from './cache';
import { extractPartySpells } from './extractPartySpells';
import { extractSeatSpells } from './extractSeatSpells';
import { fetchMemberIds } from './fetchMemberIds';
import type { HarvestConfig, PartySpell, SeatSpell } from './schemas';

export interface HarvestResult {
  members: Awaited<ReturnType<typeof fetchMemberIds>>;
  partySpells: PartySpell[];
  seatSpells: SeatSpell[];
}

export const harvestMembers = async (
  cfg: HarvestConfig,
  cacheCfg = { dir: cfg.cacheDir, forceRefresh: cfg.forceRefresh }
): Promise<HarvestResult> => {
  const base = 'https://members-api.parliament.uk';
  const members = await fetchMemberIds(base, 100, cacheCfg);

  const limit = pLimit(cfg.maxConcurrency);
  const partySpells: PartySpell[] = [];
  const seatSpells: SeatSpell[] = [];

  await Promise.all(
    members.map(m =>
      limit(async () => {
        try {
          const detail = (await cachedGet(
            `${base}/api/Members/${m.memberId}`,
            cacheCfg
          )) as Record<string, unknown>;
          partySpells.push(...extractPartySpells(m.memberId, detail, cfg));
          seatSpells.push(...extractSeatSpells(m.memberId, detail));
        } catch (e) {
          console.warn(
            `[harvest] failed member ${m.memberId}: ${(e as Error).message ?? e}`
          );
        }
      })
    )
  );

  return { members, partySpells, seatSpells };
};
