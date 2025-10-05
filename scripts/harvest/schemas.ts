import { z } from 'zod';

// Reusable ISO date (very loose; format tightening can be added later)
export const ISODateSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/, 'Expected ISO date (yyyy-mm-dd...)');

export const PartySpellSchema = z.object({
  memberId: z.number().int().nonnegative(),
  partyId: z.string().min(1),
  partyName: z.string().min(1),
  start: ISODateSchema,
  end: ISODateSchema.optional(),
  provisional: z.boolean().optional(),
});

export const SeatSpellSchema = z.object({
  memberId: z.number().int().nonnegative(),
  constituencyId: z.string().min(1),
  constituencyName: z.string().min(1),
  start: ISODateSchema,
  end: ISODateSchema.optional(),
  provisional: z.boolean().optional(),
});

export const MemberCoreSchema = z.object({
  memberId: z.number().int().nonnegative(),
  name: z.string().min(1),
  slug: z.string().optional(),
  dateOfBirth: ISODateSchema.optional(),
});

export const NormalizedDataSchema = z.object({
  members: z.array(MemberCoreSchema),
  seatSpells: z.array(SeatSpellSchema),
  partySpells: z.array(PartySpellSchema),
  parties: z.array(z.object({ partyId: z.string(), name: z.string() })),
  constituencies: z.array(z.object({ constituencyId: z.string(), name: z.string() })),
});

export const EventSchema = z.object({
  date: ISODateSchema,
  type: z.enum(['generalElection','byElection','partySwitch','seatChange','vacancyStart','vacancyEnd']),
  memberId: z.number().int().optional(),
  constituencyId: z.string().optional(),
  fromPartyId: z.string().optional(),
  toPartyId: z.string().optional(),
  note: z.string().optional(),
});

export const SnapshotMemberSchema = z.object({
  memberId: z.number().int(),
  name: z.string(),
  constituencyId: z.string(),
  constituencyName: z.string(),
  partyId: z.string(),
  partyName: z.string(),
  provisional: z.boolean().optional(),
});

export const SnapshotSchema = z.object({
  date: ISODateSchema,
  meta: z.object({
    generatedAt: ISODateSchema,
    source: z.object({ membersHash: z.string(), eventsHash: z.string() }),
  }),
  members: z.array(SnapshotMemberSchema),
  parties: z.record(z.number()),
  total: z.number().int(),
});

export const HarvestConfigSchema = z.object({
  since: ISODateSchema,
  granularity: z.enum(['events','monthly','both']),
  cacheDir: z.string(),
  mergeLabourCoop: z.boolean(),
  maxConcurrency: z.number().int().positive(),
  forceRefresh: z.boolean(),
  partyAliases: z.record(z.string()),
  source: z.enum(['membersApi','odata']).optional(),
});

// Type inferences (exported for convenience)
export type PartySpell = z.infer<typeof PartySpellSchema>;
export type SeatSpell = z.infer<typeof SeatSpellSchema>;
export type MemberCore = z.infer<typeof MemberCoreSchema>;
export type NormalizedData = z.infer<typeof NormalizedDataSchema>;
export type Event = z.infer<typeof EventSchema>;
export type SnapshotMember = z.infer<typeof SnapshotMemberSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type HarvestConfig = z.infer<typeof HarvestConfigSchema>;
