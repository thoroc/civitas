import { z } from 'zod';

// Reusable regex for ISO date/time (basic lenient check; detailed parsing left to consumer)
const isoDateTime = z.string().refine(v => !Number.isNaN(Date.parse(v)), 'Invalid ISO date/time');

export const PartySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1), // Accept any non-empty; UI assumes valid CSS color
});

export const ConstituencySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const MemberSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  constituency: ConstituencySchema.nullable(),
  party: PartySchema.nullable(),
  gender: z.string().min(1).nullable(),
  age: z.number().int().nonnegative().max(130).nullable(),
});

export const ParliamentSnapshotMetaSchema = z.object({
  date: isoDateTime,
  generatedAt: isoDateTime,
  total: z.number().int().positive(),
});

export const ParliamentSnapshotSchema = z.object({
  meta: ParliamentSnapshotMetaSchema,
  members: z.array(MemberSchema),
}).refine(obj => obj.meta.total === obj.members.length, {
  message: 'meta.total must equal members.length',
  path: ['meta', 'total'],
});

export const ParliamentIndexEntrySchema = z.object({
  date: isoDateTime,
  safeDate: z.string().min(1),
  file: z.string().min(1),
  partyMetaFile: z.string().min(1).nullable(),
  total: z.number().int().positive(),
  generatedAt: isoDateTime,
});

export const ParliamentIndexSchema = z.array(ParliamentIndexEntrySchema);

// Party meta (ideological leaning) optional payload shapes
export const PartyMetaRecordSchema = z.object({
  id: z.string().min(1),
  leaning: z.enum(['left', 'center', 'right']),
});
export const PartyMetaPayloadSchema = z.object({
  parties: z.array(PartyMetaRecordSchema),
  snapshotDate: isoDateTime.optional(),
});

// Inferred Types
export type Party = z.infer<typeof PartySchema>;
export type Constituency = z.infer<typeof ConstituencySchema>;
export type Member = z.infer<typeof MemberSchema>;
export type ParliamentSnapshotMeta = z.infer<typeof ParliamentSnapshotMetaSchema>;
export type ParliamentSnapshot = z.infer<typeof ParliamentSnapshotSchema>;
export type ParliamentIndexEntry = z.infer<typeof ParliamentIndexEntrySchema>;
export type PartyMetaRecord = z.infer<typeof PartyMetaRecordSchema>;
export type PartyMetaPayload = z.infer<typeof PartyMetaPayloadSchema>;

// Helper validation wrappers
export const validateParliamentIndex = (data: unknown) => ParliamentIndexSchema.parse(data);
export const validateParliamentSnapshot = (data: unknown) => ParliamentSnapshotSchema.parse(data);
export const validatePartyMetaPayload = (data: unknown) => PartyMetaPayloadSchema.parse(data);
