import type { SeatSpell } from './schemas';

type R = Record<string, unknown>;

interface RawInc {
  ConstituencyId: string;
  Constituency: string | R;
  Start: string;
  End?: string;
  start?: string;
  end?: string;
}

const normalizeCid = (inc: RawInc): void => {
  if (inc.ConstituencyId || typeof inc.Constituency !== 'object') return;
  const cObj = inc.Constituency as R;
  const cv = cObj?.value as R | undefined;
  const cid = cObj?.id ?? cObj?.ConstituencyId ?? cv?.id;
  const cname =
    cObj?.name ?? cObj?.nameDisplayAs ?? cv?.name ?? cv?.nameDisplayAs;
  if (cid) inc.ConstituencyId = String(cid);
  if (cname) inc.Constituency = String(cname);
};

const normalizeIncumbency = (inc: RawInc): void => {
  normalizeCid(inc);
  if (!inc.Start && inc.start) inc.Start = inc.start;
  if (!inc.End && inc.end) inc.End = inc.end;
};

const parseIncumbency = (inc: RawInc, memberId: number): SeatSpell | null => {
  if (!inc.ConstituencyId || !inc.Constituency || !inc.Start) return null;
  return {
    memberId,
    constituencyId: inc.ConstituencyId,
    constituencyName: String(inc.Constituency),
    start: inc.Start,
    end: inc.End ?? undefined,
  };
};

const deriveFallbackSeat = (
  v: R | undefined,
  memberId: number
): SeatSpell | null => {
  const lhm = v?.latestHouseMembership as R | undefined;
  if (!lhm?.membershipStartDate || !lhm?.membershipFromId) {
    console.debug(`[harvest][dbg] no seat incumbencies member=${memberId}`);
    return null;
  }
  console.debug(
    `[harvest][dbg] derived seat spell member=${memberId} constituency=${lhm.membershipFrom}`
  );
  return {
    memberId,
    constituencyId: String(lhm.membershipFromId),
    constituencyName: String(lhm.membershipFrom ?? lhm.membershipFromId),
    start: String(lhm.membershipStartDate),
    end: lhm.membershipEndDate ? String(lhm.membershipEndDate) : undefined,
    provisional: true,
  };
};

export const extractSeatSpells = (memberId: number, detail: R): SeatSpell[] => {
  const v = detail?.value as R | undefined;
  const incumbencies = (v?.Incumbencies ??
    detail?.Incumbencies ??
    []) as RawInc[];
  if (!incumbencies.length) {
    const fallback = deriveFallbackSeat(v, memberId);
    return fallback ? [fallback] : [];
  }
  const spells: SeatSpell[] = [];
  for (const inc of incumbencies) {
    normalizeIncumbency(inc);
    const spell = parseIncumbency(inc, memberId);
    if (spell) spells.push(spell);
  }
  return spells;
};
