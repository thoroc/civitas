import type { ZodError } from 'zod';

export const formatZodError = (prefix: string, z: ZodError): string => {
  const issues = z.issues
    .slice(0, 3)
    .map(i => `${i.path.join('.') || '(root)'}: ${i.message}`);
  return `${prefix}: ${issues.join('; ')}${z.issues.length > 3 ? '…' : ''}`;
};
