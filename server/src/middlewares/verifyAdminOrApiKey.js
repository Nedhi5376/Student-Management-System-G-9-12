import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/token.service.js';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/httpError.js';

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Accepts an external system via `X-API-Key` header (matching INTEGRATION_API_KEY)
 * or an admin user via the standard Bearer JWT. Used only on the historical-record
 * accept endpoint so another system can push previous student data without a login.
 */
export async function verifyAdminOrApiKey(req, _res, next) {
  const apiKey = req.get('x-api-key');

  if (env.INTEGRATION_API_KEY && apiKey && safeEqual(apiKey, env.INTEGRATION_API_KEY)) {
    if (!env.INTEGRATION_ADMIN_ID) return next(unauthorized('Integration admin not configured'));
    const admin = await User.findById(env.INTEGRATION_ADMIN_ID);
    if (!admin) return next(unauthorized('Integration admin account not found'));
    req.user = admin;
    return next();
  }

  const header = req.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return next(unauthorized());

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    const user = await User.findById(payload.sub);
    if (!user || user.role !== 'admin') return next(unauthorized());
    req.user = user;
    return next();
  } catch {
    return next(unauthorized('Access token is invalid or expired'));
  }
}