import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/RefreshToken.js';

const REFRESH_COOKIE_NAME = 'refresh_token';

export const refreshCookieName = REFRESH_COOKIE_NAME;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, type: 'access' }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  if (payload.type !== 'access') throw new Error('Unexpected token type');
  return payload;
}

export function signMfaToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'mfa' }, env.MFA_TOKEN_SECRET, { expiresIn: env.MFA_TOKEN_TTL });
}

export function verifyMfaToken(token) {
  const payload = jwt.verify(token, env.MFA_TOKEN_SECRET);
  if (payload.type !== 'mfa') throw new Error('Unexpected token type');
  return payload;
}

function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function issueRefreshToken(user, { family = crypto.randomUUID(), req } = {}) {
  const expiresAt = refreshExpiry();
  const token = jwt.sign({ sub: user._id.toString(), family, type: 'refresh', jti: crypto.randomUUID() }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    family,
    expiresAt,
    userAgent: req?.get?.('user-agent') ?? null,
    ip: req?.ip ?? null,
  });

  return { token, family, expiresAt };
}

/**
 * Verifies a refresh token and atomically claims it. Reuse of an already-rotated
 * token revokes the entire family (assumed stolen).
 */
export async function rotateRefreshToken(rawToken) {
  const payload = jwt.verify(rawToken, env.REFRESH_TOKEN_SECRET);
  if (payload.type !== 'refresh') throw new Error('Unexpected token type');

  const tokenHash = hashToken(rawToken);

  // Claim the token in a single atomic update: only one concurrent refresh can
  // win, so two parallel requests can no longer both issue successors.
  const stored = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );

  if (!stored) {
    const existing = await RefreshToken.findOne({ tokenHash }).select('family');
    if (!existing) throw new Error('Refresh token not recognised');
    // Already-revoked token being replayed — assume stolen, kill the whole family.
    await RefreshToken.updateMany({ family: existing.family, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const error = new Error('Refresh token reuse detected');
    error.reuse = true;
    throw error;
  }

  return { payload, stored };
}

export async function completeRotation(stored, user, { req } = {}) {
  const issued = await issueRefreshToken(user, { family: stored.family, req });
  stored.revokedAt = new Date();
  stored.replacedByHash = hashToken(issued.token);
  await stored.save();
  return issued;
}

export async function revokeToken(rawToken) {
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!stored || stored.revokedAt) return false;
  stored.revokedAt = new Date();
  await stored.save();
  return true;
}

export async function revokeAllForUser(userId) {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    expires: expiresAt,
    domain: env.COOKIE_DOMAIN,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    domain: env.COOKIE_DOMAIN,
  });
}
