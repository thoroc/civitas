#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { fetchWikidataEventTypeLookup } from './harvest/eventType.ts';

const toDateKey = (value: string): string => value.slice(0, 10);

const loadIndexDates = (): {
  general: Set<string>;
  byElection: Set<string>;
} => {
  const file = path.join(
    process.cwd(),
    'public',
    'data',
    'official',
    'official.index.json'
  );
  const data = JSON.parse(readFileSync(file, 'utf-8')) as Array<{
    date: string;
    eventType?: string;
  }>;
  const general = new Set<string>();
  const byElection = new Set<string>();
  for (const entry of data) {
    const key = toDateKey(entry.date);
    if (entry.eventType === 'general') general.add(key);
    if (entry.eventType === 'by-election') byElection.add(key);
  }
  return { general, byElection };
};

const loadEventDates = (): {
  general: Set<string>;
  byElection: Set<string>;
} => {
  const file = path.join(
    process.cwd(),
    'public',
    'data',
    'official',
    'events.json'
  );
  const data = JSON.parse(readFileSync(file, 'utf-8')) as Array<{
    date: string;
    type?: string;
  }>;
  const general = new Set<string>();
  const byElection = new Set<string>();
  for (const entry of data) {
    const key = toDateKey(entry.date);
    if (entry.type === 'generalElection') general.add(key);
    if (entry.type === 'byElection') byElection.add(key);
  }
  return { general, byElection };
};

const sample = (values: Set<string>, n = 10): string[] =>
  Array.from(values).sort().slice(0, n);

const diff = (a: Set<string>, b: Set<string>): string[] =>
  Array.from(a)
    .filter(x => !b.has(x))
    .sort();

const main = async () => {
  const indexDates = loadIndexDates();
  const eventDates = loadEventDates();
  const lookup = await fetchWikidataEventTypeLookup();

  const lookupGeneral = lookup.general;
  const lookupByElection = lookup.byElection;

  const generalMissingFromIndex = diff(lookupGeneral, indexDates.general);
  const byElectionMissingFromIndex = diff(
    lookupByElection,
    indexDates.byElection
  );

  console.log('Wikidata general elections:', lookupGeneral.size);
  console.log('Wikidata by-elections:', lookupByElection.size);
  console.log('Index general:', indexDates.general.size);
  console.log('Index by-election:', indexDates.byElection.size);
  console.log('Events general:', eventDates.general.size);
  console.log('Events by-election:', eventDates.byElection.size);

  console.log('\nSample Wikidata general:', sample(lookupGeneral));
  console.log('Sample Wikidata by-election:', sample(lookupByElection));

  console.log('\nSample index general:', sample(indexDates.general));
  console.log('Sample index by-election:', sample(indexDates.byElection));
  console.log('Sample events general:', sample(eventDates.general));
  console.log('Sample events by-election:', sample(eventDates.byElection));

  console.log(
    `\nWikidata general missing from index: ${generalMissingFromIndex.length}`
  );
  console.log(sample(new Set(generalMissingFromIndex)));

  console.log(
    `Wikidata by-election missing from index: ${byElectionMissingFromIndex.length}`
  );
  console.log(sample(new Set(byElectionMissingFromIndex)));

  const generalMissingFromEvents = diff(lookupGeneral, eventDates.general);
  const byElectionMissingFromEvents = diff(
    lookupByElection,
    eventDates.byElection
  );

  console.log(
    `\nWikidata general missing from events: ${generalMissingFromEvents.length}`
  );
  console.log(sample(new Set(generalMissingFromEvents)));

  console.log(
    `Wikidata by-election missing from events: ${byElectionMissingFromEvents.length}`
  );
  console.log(sample(new Set(byElectionMissingFromEvents)));
};

await main();
