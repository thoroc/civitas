import { Member } from '../types';

export type Leaning = 'left' | 'center' | 'right';
export const LEANING_ORDER: Leaning[] = ['left', 'center', 'right'];

export interface PartyGroup {
  id: string;
  label: string;
  members: Member[];
  leaning: Leaning;
  color?: string;
}

export const classifyLeaning = (
  m: Member,
  partyMeta: Record<string, { leaning: Leaning }>
): Leaning => {
  const pid = m.party?.id;
  if (pid && partyMeta[pid]?.leaning) return partyMeta[pid].leaning;
  const label = m.party?.label?.toLowerCase() || '';
  if (/green|labour|social|democrat|sinn|plaid|sdlp|alliance/.test(label))
    return 'left';
  if (/conservative|unionist|reform|libertarian|ukip/.test(label))
    return 'right';
  if (/liberal/.test(label)) return 'center';
  return 'center';
};

export const groupAndSortParties = (
  members: Member[],
  partyMeta: Record<string, { leaning: Leaning }>
): PartyGroup[] => {
  const map = new Map<string, PartyGroup>();
  for (const m of members) {
    const partyId = m.party?.id || '__independent';
    let pg = map.get(partyId);
    if (!pg) {
      pg = {
        id: partyId,
        label: m.party?.label || 'Independent',
        members: [],
        leaning: classifyLeaning(m, partyMeta),
        color: m.party?.color,
      };
      map.set(partyId, pg);
    }
    pg.members.push(m);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    const leanDiff =
      LEANING_ORDER.indexOf(a.leaning) - LEANING_ORDER.indexOf(b.leaning);
    if (leanDiff) return leanDiff;
    const sizeDiff = b.members.length - a.members.length;
    if (sizeDiff) return sizeDiff;
    return a.label.localeCompare(b.label);
  });
  return groups;
};
