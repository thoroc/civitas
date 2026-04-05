import { z } from 'zod';

// Reusable ISO date (very loose; format tightening can be added later)
export const ISODateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/, 'Expected ISO date (yyyy-mm-dd...)');
