import { z } from 'zod';

// Reusable regex for ISO date/time (basic lenient check; detailed parsing left to consumer)
export const isoDateTime = z
  .string()
  .refine(v => !Number.isNaN(Date.parse(v)), 'Invalid ISO date/time');
