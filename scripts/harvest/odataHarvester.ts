import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { HarvestConfig, MemberCore, PartySpell, SeatSpell } from './schemas';
import { ensureDir } from './cache';
import type { HarvestResult } from './membersApiClient';

/*
  Parliament Members Data Platform (MDP) endpoints (XML):
  Base: https://data.parliament.uk/membersdataplatform/services/mnis/members/query/

  We use a single bulk query to retrieve all Commons memberships (current + historical):
    House=Commons|Membership=All/
  Example:
    https://data.parliament.uk/membersdataplatform/services/mnis/members/query/House=Commons|Membership=All/

  The response is XML of shape:
    <Members>
      <Member Member_Id="172" ...>
        <DisplayAs>Ms Diane Abbott</DisplayAs>
        <Party Id="8">Independent</Party>
        <House>Commons</House>
        <MemberFrom>Hackney North and Stoke Newington</MemberFrom>
        <HouseStartDate>1987-06-11T00:00:00</HouseStartDate>
        <HouseEndDate xsi:nil="true" ... /> (or <HouseEndDate>...</HouseEndDate>)
        <CurrentStatus ...> ... </CurrentStatus>
      </Member>
      ...
    </Members>

  Observations / Limitations:
  - Party changes mid-incumbency are NOT surfaced as separate elements; each member row reflects the *current* (or final) party for that incumbency span.
  - Continuous service in the same constituency remains a single record spanning multiple general elections.
  - Therefore seat spells are reliable (seat changes & vacancies), but party spell history inside a continuous seat tenure is not derivable from this endpoint alone.
  - We still improve over the membersApi fallback by removing provisional flags and exposing multi-seat careers (and party switches that coincide with seat changes).

  Future enhancement: identify an endpoint exposing explicit party affiliation history (if available) or augment with another dataset.
*/

// Simple XML cache (separate from JSON cache)
function cacheKey(url: string) { return crypto.createHash('sha1').update(url).digest('hex'); }

async function cachedGetXml(url: string, cfg: { dir: string; forceRefresh: boolean }): Promise<string> {
  ensureDir(cfg.dir);
  const key = cacheKey(url) + '.xml';
  const file = path.join(cfg.dir, key);
  if (!cfg.forceRefresh && fs.existsSync(file)) {
    try { return fs.readFileSync(file, 'utf-8'); } catch {/* ignore */}
  }
  const res = await axios.get(url, { headers: { 'User-Agent': 'civitas-official-harvest/0.1', 'Accept': 'application/xml,text/xml;q=0.9,*/*;q=0.8' }, responseType: 'text', validateStatus: () => true });
  if (res.status !== 200) throw new Error(`GET ${url} -> ${res.status}`);
  fs.writeFileSync(file, res.data);
  return res.data as string;
}

function decodeXml(str: string | undefined): string | undefined {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const m = block.match(re);
  if (m) return decodeXml(m[1]);
  // Self-closing nil tag
  const nilRe = new RegExp(`<${tag}[^>]*xsi:nil=\"true\"[^>]*/>`, 'i');
  if (nilRe.test(block)) return undefined;
  return undefined;
}

interface ParsedMembershipRow {
  memberId: number;
  displayAs: string;
  partyId: string;
  partyName: string;
  house: string;
  memberFrom: string;
  start: string; // ISO date/time string from XML
  end?: string;  // ISO date/time string from XML
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function parseMembersXml(xml: string): ParsedMembershipRow[] {
  const rows: ParsedMembershipRow[] = [];
  const memberRe = /<Member\b([^>]*)>([\s\S]*?)<\/Member>/g;
  let m: RegExpExecArray | null;
  while ((m = memberRe.exec(xml))) {
    const attrsStr = m[1];
    const inner = m[2];
    const attrs: Record<string,string> = {};
    attrsStr.replace(/(\w+)=("[^"]*"|'[^']*')/g, (_, k, v) => { attrs[k] = v.slice(1, -1); return ''; });
    const memberId = Number(attrs['Member_Id']);
    if (!memberId) continue;
    const house = extractTag(inner, 'House');
    if (house !== 'Commons') continue; // restrict to Commons
    const displayAs = extractTag(inner, 'DisplayAs') || '';
    const memberFrom = extractTag(inner, 'MemberFrom') || '';
    const startRaw = extractTag(inner, 'HouseStartDate');
    const endRaw = extractTag(inner, 'HouseEndDate');

    // Party tag with Id attribute
    let partyId = 'unknown';
    let partyName = 'Unknown';
    const partyMatch = inner.match(/<Party\b([^>]*)>([\s\S]*?)<\/Party>/i);
    if (partyMatch) {
      const pAttrStr = partyMatch[1];
      const pName = decodeXml(partyMatch[2]) || 'Unknown';
      let pid = 'unknown';
      const idAttr = pAttrStr.match(/Id=\"([^\"]+)\"/i) || pAttrStr.match(/Id='([^']+)'/i);
      if (idAttr) pid = idAttr[1];
      partyId = pid;
      partyName = pName;
    }

    if (!startRaw) continue;

    rows.push({
      memberId,
      displayAs,
      partyId,
      partyName,
      house,
      memberFrom,
      start: startRaw,
      end: endRaw || undefined,
    });
  }
  return rows;
}

export async function harvestOData(cfg: HarvestConfig, cacheCfg = { dir: path.join(cfg.cacheDir, 'odata'), forceRefresh: cfg.forceRefresh }): Promise<HarvestResult> {
  const url = 'https://data.parliament.uk/membersdataplatform/services/mnis/members/query/House=Commons|Membership=All/';
  console.log('[odata] Fetching bulk Commons membership list');
  const xml = await cachedGetXml(url, cacheCfg);
  const rows = parseMembersXml(xml);
  console.log(`[odata] Parsed membership rows=${rows.length}`);

  // Build members (unique by memberId)
  const memberMap = new Map<number, MemberCore>();
  for (const r of rows) {
    if (!memberMap.has(r.memberId)) {
      memberMap.set(r.memberId, { memberId: r.memberId, name: r.displayAs });
    }
  }
  const members = Array.from(memberMap.values());

  const seatSpells: SeatSpell[] = [];
  const partySpells: PartySpell[] = [];

  for (const r of rows) {
    const cName = r.memberFrom || 'Unknown';
    const constituencyId = slugify(cName || `constituency-${r.memberId}`);
    seatSpells.push({
      memberId: r.memberId,
      constituencyId,
      constituencyName: cName,
      start: r.start,
      end: r.end,
    });
    partySpells.push({
      memberId: r.memberId,
      partyId: r.partyId,
      partyName: r.partyName,
      start: r.start,
      end: r.end,
    });
  }

  // Heuristic: collapse duplicate consecutive party spells for same member + partyId
  partySpells.sort((a,b)=> a.memberId - b.memberId || a.start.localeCompare(b.start));
  const collapsed: PartySpell[] = [];
  for (const ps of partySpells) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.memberId === ps.memberId && prev.partyId === ps.partyId && (prev.end === ps.start || prev.end === undefined)) {
      // Extend previous if contiguous / overlapping identical party
      if (!prev.end || (ps.end && ps.end > prev.end)) prev.end = ps.end;
    } else {
      collapsed.push({ ...ps });
    }
  }

  return { members, partySpells: collapsed, seatSpells };
}
