import { harvestMembers } from './membersApiClient.ts';
import { normalize } from './normalize.ts';
import type { HarvestConfig, NormalizedData } from './schemas';
import { NormalizedDataSchema } from './schemas';

export const runHarvest = async (
  cfg: HarvestConfig
): Promise<NormalizedData> => {
  const harvest =
    cfg.source === 'odata'
      ? await (await import('./odataHarvester.ts')).harvestOData(cfg)
      : await harvestMembers(cfg);
  console.log(
    `[official] Harvest members=${harvest.members.length} partySpells=${harvest.partySpells.length} seatSpells=${harvest.seatSpells.length}`
  );
  const normalized = normalize(harvest, cfg);
  try {
    NormalizedDataSchema.parse(normalized);
  } catch (e) {
    console.error('[official] Invalid normalized data', (e as Error).message);
  }
  console.log(
    `[official] Normalized parties=${normalized.parties.length} constituencies=${normalized.constituencies.length}`
  );
  return normalized;
};
