import fs from 'node:fs';
import path from 'node:path';

import type { PartyMetaRecord } from './types.ts';

export const loadOverrides = (): Record<string, Partial<PartyMetaRecord>> => {
  const overridePath = path.join(
    process.cwd(),
    'public',
    'data',
    'partyMeta.overrides.json'
  );
  if (!fs.existsSync(overridePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
  } catch {
    console.warn('Failed parsing overrides, ignoring.');
    return {};
  }
};
