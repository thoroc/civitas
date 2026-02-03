import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

export interface CacheConfig {
  dir: string;
  forceRefresh: boolean;
}

export const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const hashKey = (input: string) => crypto.createHash('sha1').update(input).digest('hex');

export async function cachedGet(url: string, cfg: CacheConfig): Promise<any> {
  ensureDir(cfg.dir);
  const key = hashKey(url);
  const file = path.join(cfg.dir, key + '.json');
  if (!cfg.forceRefresh && fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {/* fallthrough */}
  }
  const res = await axios.get(url, { headers: { 'User-Agent': 'civitas-official-harvest/0.1', 'Accept': 'application/json' }, validateStatus: () => true });
  if (res.status !== 200) {
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  fs.writeFileSync(file, JSON.stringify(res.data, null, 2));
  return res.data;
}
