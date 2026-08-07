import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { badRequest, unauthorized } from '../utils/httpError.js';
import {
  clearRefreshCookie,
  completeRotation,
  issueRefreshToken,
  refreshCookieName,
  revokeAllForUser,
  revokeToken,
  rotateRefreshToken,
  setRefreshCookie,
  signAccessToken,
  signMfaToken,
  verifyMfaToken,
} from '../services/token.service.js';
import { consumeBackupCode, verifyTotp } from '../services/mfa.service.js';
import { createEmailVerificationToken, hashVerificationToken, sendVerificationEmail } from '../services/email.service.js';

const GENERIC_CREDENTIALS_ERROR = 'Invalid email or password';
const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCK_MS = 30 * 1000;
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Dummy hash so failed logins spend the same time as successful ones (timing attacks). */
const DUMMY_HASH = bcrypt.hashSync('timing-attack-placeholder', env.BCRYPT_SALT_ROUNDS);

function lockDurationMs(failedAttempts) {
  const exponent = Math.min(failedAttempts - MAX_FAILED_ATTEMPTS, 6);
  return BASE_LOCK_MS * 2 ** Math.max(exponent, 0);
}

async function populateStudentClass(user) {
  if (user.role === 'student' && user.classId) await user.populate('classId');
}

async function issueSession(res, user, req) {
  const { token, expiresAt } = await issueRefreshToken(user, { req });
  setRefreshCookie(res, token, expiresAt);
  await populateStudentClass(user);
  return { accessToken: signAccessToken(user), user: user.toPublicJSON() };
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    // Generic response prevents account enumeration through the register form.
    logger.auth('register.duplicate', { email });
    return res.status(202).json({
      message: 'If this email is available, a verification link has been sent.',
    });
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const verification = createEmailVerificationToken();

  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationExpiresAt: verification.expiresAt,
  });

  const verificationLink = await sendVerificationEmail(email, verification.token);
  logger.auth('register.success', { userId: user._id.toString() });

  return res.status(202).json({
    message: 'If this email is available, a verification link has been sent.',
    ...(env.isProduction ? {} : { devVerificationLink: verificationLink }),
  });
}

export async function verifyEmail(req, res) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) throw badRequest('Verification token is required');

  const user = await User.findOne({
    emailVerified: false,
    emailVerificationTokenHash: hashVerificationToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) throw badRequest('Verification link is invalid or has expired');

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();
  logger.auth('email.verified', { userId: user._id.toString() });
  return res.json({ message: 'Email verified. You can now sign in.' });
}

export async function login(req, res) {
  const { identifier, password } = req.body;
  const normalized = identifier.trim();

  // Students log in with their full name (or National ID); staff may use email.
  const user = await User.findOne({
    $or: [
      { email: normalized.toLowerCase() },
      { name: { $regex: new RegExp(`^${escapeRegExp(normalized)}$`, 'i') } },
      { nationalId: normalized },
    ],
  }).select('+passwordHash +failedLoginAttempts +lockedUntil +mfa.secret +mfa.enabled');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    logger.auth('login.failure', { identifier: normalized, reason: 'unknown_user' });
    throw unauthorized(GENERIC_CREDENTIALS_ERROR);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    logger.auth('login.locked', { userId: user._id.toString() });
    throw unauthorized(GENERIC_CREDENTIALS_ERROR);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + lockDurationMs(user.failedLoginAttempts));
    }
    await user.save();
    logger.auth('login.failure', {
      userId: user._id.toString(),
      failedAttempts: user.failedLoginAttempts,
      reason: 'bad_password',
    });
    throw unauthorized(GENERIC_CREDENTIALS_ERROR);
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  if (user.mfa.enabled) {
    logger.auth('login.mfa_required', { userId: user._id.toString() });
    return res.json({ mfaRequired: true, mfaToken: signMfaToken(user) });
  }

  logger.auth('login.success', { userId: user._id.toString() });
  return res.json(await issueSession(res, user, req));
}

export async function verifyMfaLogin(req, res) {
  const { mfaToken, code } = req.body;

  let payload;
  try {
    payload = verifyMfaToken(mfaToken);
  } catch {
    throw unauthorized('MFA session expired, please sign in again');
  }

  const user = await User.findById(payload.sub).select('+mfa.secret +mfa.enabled +mfa.backupCodes');
  if (!user || !user.mfa.enabled || !user.mfa.secret) throw unauthorized('MFA is not enabled for this account');

  if (verifyTotp(user.mfa.secret, code)) {
    logger.auth('mfa.success', { userId: user._id.toString(), method: 'totp' });
    return res.json(await issueSession(res, user, req));
  }

  const consumed = await consumeBackupCode(user.mfa.backupCodes, code);
  if (consumed) {
    user.mfa.backupCodes = consumed;
    await user.save();
    logger.auth('mfa.success', { userId: user._id.toString(), method: 'backup_code' });
    return res.json(await issueSession(res, user, req));
  }

  logger.auth('mfa.failure', { userId: user._id.toString() });
  throw unauthorized('Invalid verification code');
}

export async function refresh(req, res) {
  const rawToken = req.cookies?.[refreshCookieName];
  if (!rawToken) throw unauthorized('Refresh token missing');

  let rotation;
  try {
    rotation = await rotateRefreshToken(rawToken);
  } catch (error) {
    clearRefreshCookie(res);
    if (error.reuse) logger.auth('refresh.reuse_detected', {});
    throw unauthorized('Session expired, please sign in again');
  }

  const user = await User.findById(rotation.payload.sub);
  if (!user) {
    clearRefreshCookie(res);
    throw unauthorized('Session expired, please sign in again');
  }

  const issued = await completeRotation(rotation.stored, user, { req });
  setRefreshCookie(res, issued.token, issued.expiresAt);
  await populateStudentClass(user);
  logger.auth('refresh.success', { userId: user._id.toString() });

  return res.json({ accessToken: signAccessToken(user), user: user.toPublicJSON() });
}

export async function logout(req, res) {
  const rawToken = req.cookies?.[refreshCookieName];
  if (rawToken) await revokeToken(rawToken);
  clearRefreshCookie(res);
  logger.auth('logout', { userId: req.user?._id?.toString() });
  return res.json({ message: 'Signed out' });
}

export async function logoutAll(req, res) {
  await revokeAllForUser(req.user._id);
  clearRefreshCookie(res);
  logger.auth('logout_all', { userId: req.user._id.toString() });
  return res.json({ message: 'Signed out from all devices' });
}
