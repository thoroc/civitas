import { HarvestResult } from './membersApiClient';
import { HarvestConfig, NormalizedData, PartySpell, SeatSpell } from './schemas';

function toISO(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  // Accept already ISO; otherwise try Date parse
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

interface SpellKeyOpts { endDefault?: string }

function normalizeSpells<T extends { start: string; end?: string }>(spells: T[], { endDefault }: SpellKeyOpts = {}): T[] {
  return spells.map(s => ({ ...s, start: toISO(s.start)! , end: toISO(s.end) || endDefault }))
    .filter(s => !!s.start)
    .sort((a,b)=> (a.start! < b.start! ? -1 : a.start! > b.start! ? 1 : 0));
}

function mergeLabourCoopParty(spells: PartySpell[]): PartySpell[] {
  return spells.map(s => {
    if ((s.partyName.includes('Labour') && s.partyName.includes('Co-operative')) || s.partyName === 'Labour Co-operative') {
      return { ...s, partyId: 'labour_coop', partyName: 'Labour & Co-operative' };
    }
    return s;
  });
}

export function normalize(harvest: HarvestResult, cfg: HarvestConfig): NormalizedData {
  let partySpells: PartySpell[] = normalizeSpells(harvest.partySpells);
  let seatSpells: SeatSpell[] = normalizeSpells(harvest.seatSpells);

  if (cfg.mergeLabourCoop) {
    partySpells = mergeLabourCoopParty(partySpells);
  }

  // Apply alias collapsing (cfg.partyAliases maps original -> canonical)
  partySpells = partySpells.map(ps => ({ ...ps, partyId: cfg.partyAliases[ps.partyId] || ps.partyId }));

  // Filter by since date: keep spells that overlap since or start after.
  const since = cfg.since;
  const overlapsSince = <T extends { start: string; end?: string }>(s: T) => !s.end || s.end >= since;
  partySpells = partySpells.filter(overlapsSince);
  seatSpells = seatSpells.filter(overlapsSince);

  const partiesMap = new Map<string,string>();
  for (const ps of partySpells) if (!partiesMap.has(ps.partyId)) partiesMap.set(ps.partyId, ps.partyName);
  const constituenciesMap = new Map<string,string>();
  for (const ss of seatSpells) if (!constituenciesMap.has(ss.constituencyId)) constituenciesMap.set(ss.constituencyId, ss.constituencyName);

  const members = harvest.members; // Already minimal

  return {
    members,
    seatSpells,
    partySpells,
    parties: Array.from(partiesMap, ([partyId, name]) => ({ partyId, name })).sort((a,b)=>a.partyId.localeCompare(b.partyId)),
    constituencies: Array.from(constituenciesMap, ([constituencyId, name]) => ({ constituencyId, name })).sort((a,b)=>a.constituencyId.localeCompare(b.constituencyId)),
  };
}
