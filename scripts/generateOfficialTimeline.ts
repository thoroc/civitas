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
  const source = (args.source as any) || 'membersApi';

  const cfg: HarvestConfig = { since, granularity, cacheDir, mergeLabourCoop, maxConcurrency, forceRefresh, partyAliases, source };

  console.log(`[official] Harvest starting since=${since} granularity=${granularity} source=${source}`);
  let harvest;
  if (source === 'odata') {
    const { harvestOData } = await import('./harvest/odataHarvester');
    harvest = await harvestOData(cfg);
  } else {
    harvest = await harvestMembers(cfg);
  }
  console.log(`[official] Harvest members=${harvest.members.length} partySpells=${harvest.partySpells.length} seatSpells=${harvest.seatSpells.length}`);

  const normalized = normalize(harvest, cfg);
  console.log(`[official] Normalized parties=${normalized.parties.length} constituencies=${normalized.constituencies.length}`);

  const events = buildEvents(normalized, cfg);
  console.log(`[official] Events count=${events.length}`);

  // Enhanced validation: overlaps, negative durations, gaps between spells (per member)
  interface TemporalSpell { memberId: number; start: string; end?: string }
  interface ValidationReport { overlaps: string[]; negatives: string[]; gaps: string[] }
  function validateSpells<T extends TemporalSpell>(spells: T[], label: string): ValidationReport {
    const byMember = new Map<number, T[]>();
    for (const s of spells) {
      if (!byMember.has(s.memberId)) byMember.set(s.memberId, []);
      byMember.get(s.memberId)!.push(s);
    }
    const overlaps: string[] = [];
    const negatives: string[] = [];
    const gaps: string[] = [];
    const dayMs = 24*60*60*1000;
    for (const [mid, arrRaw] of Array.from(byMember.entries())) {
      const arr = arrRaw.slice().sort((a,b)=> a.start.localeCompare(b.start));
      for (const s of arr) {
        if (s.end && s.end < s.start) {
          negatives.push(`${label} negative member=${mid} (${s.start}-${s.end})`);
        }
      }
      for (let i=1;i<arr.length;i++) {
        const prev = arr[i-1];
        const curr = arr[i];
        if (!prev.end || prev.end > curr.start) {
          overlaps.push(`${label} overlap member=${mid} prev(${prev.start}-${prev.end||''}) curr(${curr.start}-${curr.end||''})`);
        } else if (prev.end < curr.start) {
          // gap (prev ends before current starts)
          const gapDays = Math.round((Date.parse(curr.start) - Date.parse(prev.end))/dayMs);
            gaps.push(`${label} gap member=${mid} prevEnd=${prev.end} nextStart=${curr.start} days=${gapDays}`);
        }
      }
    }
    return { overlaps, negatives, gaps };
  }
  const partyValidation = validateSpells(normalized.partySpells, 'party');
  const seatValidation = validateSpells(normalized.seatSpells, 'seat');
  const anyIssues = ['overlaps','negatives','gaps'].some(k => (partyValidation as any)[k].length || (seatValidation as any)[k].length);
  if (anyIssues) {
    console.warn(`[official][validate] party overlaps=${partyValidation.overlaps.length} negatives=${partyValidation.negatives.length} gaps=${partyValidation.gaps.length}`);
    console.warn(`[official][validate] seat  overlaps=${seatValidation.overlaps.length} negatives=${seatValidation.negatives.length} gaps=${seatValidation.gaps.length}`);
    const logSample = (title: string, arr: string[]) => { if (arr.length) { console.warn(`  ${title}:`); for (const msg of arr.slice(0,10)) console.warn('    ', msg); if (arr.length>10) console.warn('    ...'); } };
    logSample('party overlaps', partyValidation.overlaps);
    logSample('party negatives', partyValidation.negatives);
    logSample('party gaps', partyValidation.gaps);
    logSample('seat overlaps', seatValidation.overlaps);
    logSample('seat negatives', seatValidation.negatives);
    logSample('seat gaps', seatValidation.gaps);
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
