import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import qrcode from 'qrcode';
import { authenticator } from 'otplib';
import { env } from '../config/env.js';

authenticator.options = { window: 1, step: 30 };

const BACKUP_CODE_COUNT = 8;

export function generateSecret() {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(email, secret) {
  return authenticator.keyuri(email, env.MFA_ISSUER, secret);
}

export async function buildQrDataUrl(otpauthUrl) {
  return qrcode.toDataURL(otpauthUrl);
}

export function verifyTotp(secret, code) {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

function randomBackupCode() {
  const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export async function generateBackupCodes() {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, randomBackupCode);
  const hashed = await Promise.all(
    plain.map(async (code) => ({ codeHash: await bcrypt.hash(code, env.BCRYPT_SALT_ROUNDS), usedAt: null })),
  );
  return { plain, hashed };
}

/** Consumes a single-use backup code; returns the mutated list or null on failure. */
export async function consumeBackupCode(backupCodes, candidate) {
  const normalized = candidate.trim().toUpperCase();
  for (const entry of backupCodes) {
    if (entry.usedAt) continue;
    if (await bcrypt.compare(normalized, entry.codeHash)) {
      entry.usedAt = new Date();
      return backupCodes;
    }
  }
  return null;
}
