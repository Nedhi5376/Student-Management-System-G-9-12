import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * The token is a 256-bit random value, so a salted hash adds no protection;
 * a plain SHA-256 digest lets us look the user up in O(1) instead of
 * bcrypt-comparing against every unverified account.
 */
export function hashVerificationToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  };
}

/**
 * Transport-agnostic sender. Swap the transport for SES/SendGrid in production.
 * The signed link is never logged; callers receive it for dev-only surfacing.
 */
export async function sendVerificationEmail(email, token) {
  const link = `${env.clientOrigins[0]}/verify-email?token=${token}`;
  logger.info('verification email dispatched', { email });
  return link;
}
