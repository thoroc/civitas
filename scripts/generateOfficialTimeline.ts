#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { harvestMembers } from './harvest/membersApiClient';
import { normalize } from './harvest/normalize';
import { buildEvents } from './harvest/buildEvents';
import { buildSnapshots } from './harvest/buildSnapshots';
import { HarvestConfig } from './harvest/types';

interface Args { [k: string]: string | boolean | undefined }

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const out: Args = {};
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i+1];
      if (!next || next.startsWith('--')) { out[key] = true; } else { out[key] = next; i++; }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const since = String(args.since || '2005-01-01');
  const granularity = (args.granularity as any) || 'events';
  const mergeLabourCoop = !!args['merge-labour-coop'];
  const forceRefresh = !!args['force-refresh'];
  const maxConcurrency = parseInt(String(args['max-concurrency']||'6'),10);
  const cacheDir = String(args['cache-dir'] || path.join('.cache','members-api'));
  const partyAliases: Record<string,string> = {}; // placeholder for future mapping

  const cfg: HarvestConfig = { since, granularity, cacheDir, mergeLabourCoop, maxConcurrency, forceRefresh, partyAliases };

  console.log(`[official] Harvest starting since=${since} granularity=${granularity}`);
  const harvest = await harvestMembers(cfg);
  console.log(`[official] Harvest members=${harvest.members.length} partySpells=${harvest.partySpells.length} seatSpells=${harvest.seatSpells.length}`);

  const normalized = normalize(harvest, cfg);
  console.log(`[official] Normalized parties=${normalized.parties.length} constituencies=${normalized.constituencies.length}`);

  const events = buildEvents(normalized, cfg);
  console.log(`[official] Events count=${events.length}`);

  // Basic validation: detect overlapping spells per member (party & seat)
  function detectOverlaps<T extends { memberId: number; start: string; end?: string }>(spells: T[], label: string) {
    const byMember = new Map<number, T[]>();
    for (const s of spells) {
      if (!byMember.has(s.memberId)) byMember.set(s.memberId, []);
      byMember.get(s.memberId)!.push(s);
    }
    const issues: string[] = [];
    for (const [mid, arr] of Array.from(byMember.entries())) {
      arr.sort((a,b)=> a.start.localeCompare(b.start));
      for (let i=1;i<arr.length;i++) {
        const prev = arr[i-1];
        const curr = arr[i];
        if (!prev.end || prev.end > curr.start) {
          issues.push(`${label} overlap member=${mid} prev(${prev.start}-${prev.end||''}) curr(${curr.start}-${curr.end||''})`);
        }
      }
    }
    return issues;
  }
  const partyOverlap = detectOverlaps(normalized.partySpells, 'party');
  const seatOverlap = detectOverlaps(normalized.seatSpells, 'seat');
  if (partyOverlap.length || seatOverlap.length) {
    console.warn(`[official][validate] overlaps detected party=${partyOverlap.length} seat=${seatOverlap.length}`);
    for (const msg of partyOverlap.slice(0,10)) console.warn('  ', msg);
    for (const msg of seatOverlap.slice(0,10)) console.warn('  ', msg);
    if (partyOverlap.length > 10) console.warn('  ...');
    if (seatOverlap.length > 10) console.warn('  ...');
  }

  const monthly = granularity !== 'events';
  const snapshots = buildSnapshots(normalized, events, { monthly });
  console.log(`[official] Snapshots count=${snapshots.length}`);

  const outDir = path.join('public','data','official');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});

  // Write events
  fs.writeFileSync(path.join(outDir,'events.json'), JSON.stringify(events,null,2));

  // Write snapshots and index
  const index: any[] = [];
  for (const sn of snapshots) {
    const safeDate = sn.date.replace(/:/g,'-');
    const file = `official-parliament-${safeDate}.json`;
    fs.writeFileSync(path.join(outDir,file), JSON.stringify(sn,null,2));
    index.push({ date: sn.date, safeDate, file, total: sn.total, generatedAt: sn.meta.generatedAt });
  }
  fs.writeFileSync(path.join(outDir,'official.index.json'), JSON.stringify(index,null,2));
  console.log(`[official] Wrote ${snapshots.length} snapshots to ${outDir}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
