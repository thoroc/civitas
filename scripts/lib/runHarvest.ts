import { harvestMembers } from '../harvest/membersApiClient.ts';
import { normalize } from '../harvest/normalize.ts';
import type { HarvestConfig, NormalizedData } from '../harvest/schemas.ts';
import { NormalizedDataSchema } from '../harvest/schemas.ts';

export const runHarvest = async (
  cfg: HarvestConfig
): Promise<NormalizedData> => {
  const harvest =
    cfg.source === 'odata'
      ? await (await import('../harvest/odataHarvester.ts')).harvestOData(cfg)
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
