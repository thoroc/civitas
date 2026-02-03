import pLimit from 'p-limit';
import { cachedGet } from './cache';
import { HarvestConfig, MemberCore, PartySpell, SeatSpell } from './schemas';

interface RawSearchMember { MemberId: number; Name: string; }

// NOTE: Actual API field names may differ; placeholders used until integrated.
interface RawPartySpell { PartyId: string; Party: string; Start: string; End?: string }
interface RawSeatSpell { ConstituencyId: string; Constituency: string; Start: string; End?: string }

export interface HarvestResult {
  members: MemberCore[];
  partySpells: PartySpell[];
  seatSpells: SeatSpell[];
}

export async function harvestMembers(cfg: HarvestConfig, cacheCfg = { dir: cfg.cacheDir, forceRefresh: cfg.forceRefresh }): Promise<HarvestResult> {
  const base = 'https://members-api.parliament.uk';
  const pageSize = 100;
  let skip = 0;
  const members: MemberCore[] = [];

  while (true) {
    const url = `${base}/api/Members/Search?House=Commons&IsCurrentMember=false&skip=${skip}&take=${pageSize}`;
    const data = await cachedGet(url, cacheCfg);
    // API shape may nest results under data or items arrays; guard accordingly.
    const rawItems = (data && (data.items || data.value || data.results)) || [];
    const batch: RawSearchMember[] = Array.isArray(rawItems) ? rawItems.map((it:any)=> ({ MemberId: it?.value?.id || it?.MemberId || it?.Id || it?.id, Name: it?.value?.nameDisplayAs || it?.Name || it?.DisplayAs || it?.name || '' })) : [];
    if (!batch.length) break;
    for (const m of batch) {
      members.push({ memberId: m.MemberId, name: m.Name });
    }
    if (batch.length < pageSize) break;
    skip += pageSize;
  }

  const limit = pLimit(cfg.maxConcurrency);
  const partySpells: PartySpell[] = [];
  const seatSpells: SeatSpell[] = [];

  const enableHistory = process.env.MEMBERS_API_INCLUDE_HISTORY === '1';

  await Promise.all(members.map(m => limit(async () => {
    try {
      if (!m.memberId) return; // skip invalid
      // Fetch detail first (contains incumbencies and possibly party history)
      const detailUrl = `${base}/api/Members/${m.memberId}`;
      const detail: any = await cachedGet(detailUrl, cacheCfg);

      // Optional full history endpoints (scaffold). Real endpoints TBD.
      if (enableHistory) {
        try {
          // Placeholder: attempt generic endpoints (expected to 404 until confirmed).
          const historyPartyUrl = `${base}/api/Members/${m.memberId}/Parties`; // already tried below; future alternative could differ
          // Intentionally not reusing existing fetch to avoid double call; rely on cache layer.
          await cachedGet(historyPartyUrl, cacheCfg);
          const historySeatsUrl = `${base}/api/Members/${m.memberId}/Incumbencies`;
          await cachedGet(historySeatsUrl, cacheCfg);
        } catch (e:any) {
          console.debug(`[harvest][history][dbg] history fetch failed member=${m.memberId} msg=${e.message||e}`);
        }
      }

      // Attempt dedicated parties endpoint; fall back silently if 404/empty
      let partiesCollected = false;
      try {
        const partyUrl = `${base}/api/Members/${m.memberId}/Parties`;
        const partiesRaw: RawPartySpell[] = await cachedGet(partyUrl, cacheCfg);
        if (Array.isArray(partiesRaw) && partiesRaw.length) {
          for (const ps of partiesRaw) {
            if (!ps.PartyId || !ps.Party || !ps.Start) continue;
            partySpells.push({
              memberId: m.memberId,
              partyId: cfg.partyAliases[ps.PartyId] || ps.PartyId,
              partyName: ps.Party,
              start: ps.Start,
              end: ps.End || undefined,
            });
          }
          partiesCollected = true;
        }
      } catch (_) {
        // swallow; will attempt to derive from detail below
      }

      if (!partiesCollected) {
        // Heuristic extraction from detail structure (observed patterns from API docs / examples):
        // Possible paths: value.Parties, value.PartyHistory, Parties, PartyHistory
        const partyContainers = [
          detail?.value?.Parties,
          detail?.value?.PartyHistory,
          detail?.Parties,
          detail?.PartyHistory,
        ].filter(Boolean);
        for (const container of partyContainers) {
          if (Array.isArray(container)) {
            for (const raw of container as any[]) {
              const pid = raw?.value?.id || raw?.PartyId || raw?.Id || raw?.id;
              const name = raw?.value?.name || raw?.value?.nameDisplayAs || raw?.Party || raw?.Name || raw?.nameDisplayAs;
              const start = raw?.Start || raw?.start || raw?.value?.Start || raw?.value?.start;
              const end = raw?.End || raw?.end || raw?.value?.End || raw?.value?.end;
              if (pid && name && start) {
                partySpells.push({
                  memberId: m.memberId,
                  partyId: cfg.partyAliases[String(pid)] || String(pid),
                  partyName: name,
                  start: start,
                  end: end || undefined,
                });
              }
            }
          }
        }
      }

      if (partySpells.filter(p=>p.memberId===m.memberId).length===0) {
        // Derive a single current (or final) party spell from latestParty + membership start as fallback
        const lp = detail?.value?.latestParty;
        const lhm = detail?.value?.latestHouseMembership;
        if (lp && lhm?.membershipStartDate) {
          partySpells.push({
            memberId: m.memberId,
            partyId: cfg.partyAliases[String(lp.id)] || String(lp.id),
            partyName: lp.name || lp.abbreviation || String(lp.id),
            start: lhm.membershipStartDate,
            end: lhm.membershipEndDate || undefined,
            provisional: true,
          });
          console.debug(`[harvest][dbg] derived party spell member=${m.memberId} party=${lp.name}`);
        } else {
          console.debug(`[harvest][dbg] no party spells parsed member=${m.memberId} keys=${Object.keys(detail||{})} valueKeys=${detail?.value? Object.keys(detail.value):[]}`);
        }
      }

      const incumbencies: RawSeatSpell[] = detail?.value?.Incumbencies || detail?.Incumbencies || [];
      if (incumbencies.length===0) {
        // Derive a single seat spell from latestHouseMembership if available
        const lhm = detail?.value?.latestHouseMembership;
        if (lhm?.membershipStartDate && lhm?.membershipFromId) {
          seatSpells.push({
            memberId: m.memberId,
            constituencyId: String(lhm.membershipFromId),
            constituencyName: lhm.membershipFrom || String(lhm.membershipFromId),
            start: lhm.membershipStartDate,
            end: lhm.membershipEndDate || undefined,
            provisional: true,
          });
          console.debug(`[harvest][dbg] derived seat spell member=${m.memberId} constituency=${lhm.membershipFrom}`);
        } else {
          console.debug(`[harvest][dbg] no seat incumbencies member=${m.memberId}`);
        }
      }
      for (const inc of incumbencies) {
        if (!inc.ConstituencyId && typeof inc.Constituency === 'object') {
          const cObj: any = inc.Constituency;
            const cid = cObj?.id || cObj?.ConstituencyId || cObj?.value?.id;
            const cname = cObj?.name || cObj?.nameDisplayAs || cObj?.value?.name || cObj?.value?.nameDisplayAs;
            if (cid) inc.ConstituencyId = cid;
            if (cname) (inc as any).Constituency = cname;
        }
        if (!inc.Start && (inc as any).start) inc.Start = (inc as any).start;
        if (!inc.End && (inc as any).end) inc.End = (inc as any).end;
        if (inc.ConstituencyId && inc.Constituency && inc.Start) {
          seatSpells.push({
            memberId: m.memberId,
            constituencyId: inc.ConstituencyId,
            constituencyName: inc.Constituency,
            start: inc.Start,
            end: inc.End || undefined,
          });
        }
      }
    } catch (e:any) {
      console.warn(`[harvest] failed member ${m.memberId}: ${e.message || e}`);
    }
  })))

  return { members, partySpells, seatSpells };
}
