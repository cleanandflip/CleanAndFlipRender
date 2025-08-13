/**
 * Address Fingerprint Generator
 * Creates SHA256 hash of canonical address for efficient uniqueness constraints
 */

import { createHash } from 'crypto';

export const fingerprintOf = (canonicalLine: string): string =>
  createHash('sha256').update(canonicalLine).digest('hex');