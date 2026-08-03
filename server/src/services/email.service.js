import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: await bcrypt.hash(token, env.BCRYPT_SALT_ROUNDS),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  };
}

export async function matchesVerificationToken(tokenHash, token) {
  if (!tokenHash) return false;
  return bcrypt.compare(token, tokenHash);
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
