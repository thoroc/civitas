import { z } from 'zod';
import { ISODateSchema } from './iso-date-schema.ts';

export const HarvestConfigSchema = z.object({
  since: ISODateSchema,
  granularity: z.enum(['events', 'monthly', 'both']),
  cacheDir: z.string(),
  mergeLabourCoop: z.boolean(),
  maxConcurrency: z.number().int().positive(),
  forceRefresh: z.boolean(),
  partyAliases: z.record(z.string()),
  source: z.enum(['membersApi', 'odata']).optional(),
});

export type HarvestConfig = z.infer<typeof HarvestConfigSchema>;
