import path from 'node:path';

export const OUTPUT_DIR: string = path.join(process.cwd(), 'public', 'data');
export const PARLIAMENT_INDEX: string = path.join(
  OUTPUT_DIR,
  'parliament.index.json'
);
export const OFFICIAL_DIR: string = path.join(OUTPUT_DIR, 'official');
export const OFFICIAL_INDEX: string = path.join(
  OFFICIAL_DIR,
  'official.index.json'
);
