import type { HarvestConfig, PartySpell } from './schemas';

type R = Record<string, unknown>;

const parseRawSpell = (
  raw: R,
  memberId: number,
  aliases: Record<string, string>
): PartySpell | null => {
  const rv = raw?.value as R | undefined;
  const pid = rv?.id ?? raw?.PartyId ?? raw?.Id ?? raw?.id;
  const name =
    rv?.name ??
    rv?.nameDisplayAs ??
    raw?.Party ??
    raw?.Name ??
    raw?.nameDisplayAs;
  const start = raw?.Start ?? raw?.start ?? rv?.Start ?? rv?.start;
  const end = raw?.End ?? raw?.end ?? rv?.End ?? rv?.end;
  if (!pid || !name || !start) return null;
  return {
    memberId,
    partyId: aliases[String(pid)] ?? String(pid),
    partyName: String(name),
    start: String(start),
    end: end ? String(end) : undefined,
  };
};

const collectContainerSpells = (
  containers: unknown[],
  memberId: number,
  aliases: Record<string, string>
): PartySpell[] => {
  const spells: PartySpell[] = [];
  for (const container of containers) {
    for (const raw of container as R[]) {
      const spell = parseRawSpell(raw, memberId, aliases);
      if (spell) spells.push(spell);
    }
  }
  return spells;
};

const deriveFallbackSpell = (
  v: R | undefined,
  memberId: number,
  aliases: Record<string, string>
): PartySpell | null => {
  const lp = v?.latestParty as R | undefined;
  const lhm = v?.latestHouseMembership as R | undefined;
  if (!lp || !lhm?.membershipStartDate) {
    console.debug(`[harvest][dbg] no party spells parsed member=${memberId}`);
    return null;
  }
  console.debug(
    `[harvest][dbg] derived party spell member=${memberId} party=${lp.name}`
  );
  return {
    memberId,
    partyId: aliases[String(lp.id)] ?? String(lp.id),
    partyName: String(lp.name ?? lp.abbreviation ?? lp.id),
    start: String(lhm.membershipStartDate),
    end: lhm.membershipEndDate ? String(lhm.membershipEndDate) : undefined,
    provisional: true,
  };
};

export const extractPartySpells = (
  memberId: number,
  detail: R,
  cfg: HarvestConfig
): PartySpell[] => {
  const v = detail?.value as R | undefined;
  const containers = [
    v?.Parties,
    v?.PartyHistory,
    detail?.Parties,
    detail?.PartyHistory,
  ].filter(Array.isArray);
  const spells = collectContainerSpells(containers, memberId, cfg.partyAliases);
  if (spells.length) return spells;
  const fallback = deriveFallbackSpell(v, memberId, cfg.partyAliases);
  return fallback ? [fallback] : [];
};
