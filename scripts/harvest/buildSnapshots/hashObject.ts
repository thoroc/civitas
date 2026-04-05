import crypto from 'node:crypto';

export const hashObject = (value: unknown): string =>
  crypto
    .createHash('sha1')
    .update(JSON.stringify(value))
    .digest('hex')
    .slice(0, 10);
