import { z } from 'zod';

import { type ParliamentSnapshot, ParliamentSnapshotSchema } from '../schemas';

const OfficialMemberSchema = z.object({
  memberId: z.number().int(),
  name: z.string().min(1),
  constituencyId: z.string(),
  constituencyName: z.string(),
  partyId: z.string(),
  partyName: z.string(),
  provisional: z.boolean().optional(),
});

const OfficialSnapshotSchema = z.object({
  date: z.string().min(1),
  meta: z
    .object({
      generatedAt: z.string().min(1),
    })
    .passthrough()
    .optional(),
  members: z.array(OfficialMemberSchema),
  total: z.number().int(),
});

export const adaptOfficialSnapshot = (
  raw: unknown,
  partyColors: Record<string, string>
): ParliamentSnapshot => {
  const official = OfficialSnapshotSchema.parse(raw);
  const generatedAt = official.meta?.generatedAt ?? new Date().toISOString();

  const members = official.members.map(m => ({
    id: String(m.memberId),
    label: m.name,
    constituency: { id: m.constituencyId, label: m.constituencyName },
    party: {
      id: m.partyId,
      label: m.partyName,
      color: partyColors[m.partyId] ?? '#808080',
    },
    gender: null,
    age: null,
  }));

  const adapted = {
    meta: {
      date: official.date,
      generatedAt,
      total: members.length,
    },
    members,
  };

  return ParliamentSnapshotSchema.parse(adapted);
};
