import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { badRequest, unauthorized } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
import {
  buildOtpAuthUrl,
  buildQrDataUrl,
  generateBackupCodes,
  generateSecret,
  verifyTotp,
} from '../services/mfa.service.js';
import { revokeAllForUser } from '../services/token.service.js';

/** Stores the secret as `pendingSecret` until a valid code proves the pairing worked. */
export async function setupMfa(req, res) {
  const user = await User.findById(req.user._id).select('+mfa.secret +mfa.pendingSecret');
  if (user.mfa.enabled) throw badRequest('MFA is already enabled');

  const secret = generateSecret();
  user.mfa.pendingSecret = secret;
  await user.save();

  const otpauthUrl = buildOtpAuthUrl(user.email, secret);
  logger.auth('mfa.setup_started', { userId: user._id.toString() });

  return res.json({ otpauthUrl, qrDataUrl: await buildQrDataUrl(otpauthUrl) });
}

export async function enableMfa(req, res) {
  const { code } = req.body;
  const user = await User.findById(req.user._id).select('+mfa.secret +mfa.pendingSecret +mfa.backupCodes');

  if (!user.mfa.pendingSecret) throw badRequest('Start MFA setup before enabling it');
  if (!verifyTotp(user.mfa.pendingSecret, code)) {
    logger.auth('mfa.enable_failure', { userId: user._id.toString() });
    throw badRequest('Invalid verification code');
  }

  const backupCodes = await generateBackupCodes();
  user.mfa.secret = user.mfa.pendingSecret;
  user.mfa.pendingSecret = null;
  user.mfa.enabled = true;
  user.mfa.backupCodes = backupCodes.hashed;
  await user.save();

  // Force re-authentication elsewhere now that the security posture changed.
  await revokeAllForUser(user._id);
  logger.auth('mfa.enabled', { userId: user._id.toString() });

  return res.json({ message: 'MFA enabled', backupCodes: backupCodes.plain });
}

export async function disableMfa(req, res) {
  const { password, code } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash +mfa.secret +mfa.backupCodes');

  if (!user.mfa.enabled || !user.mfa.secret) throw badRequest('MFA is not enabled');
  if (!(await bcrypt.compare(password, user.passwordHash))) throw unauthorized('Invalid credentials');
  if (!verifyTotp(user.mfa.secret, code)) throw badRequest('Invalid verification code');

  user.mfa.enabled = false;
  user.mfa.secret = null;
  user.mfa.pendingSecret = null;
  user.mfa.backupCodes = [];
  await user.save();

  logger.auth('mfa.disabled', { userId: user._id.toString() });
  return res.json({ message: 'MFA disabled' });
}

export async function regenerateBackupCodes(req, res) {
  const user = await User.findById(req.user._id).select('+mfa.secret +mfa.backupCodes');
  if (!user.mfa.enabled) throw badRequest('MFA is not enabled');

  const backupCodes = await generateBackupCodes();
  user.mfa.backupCodes = backupCodes.hashed;
  await user.save();

  logger.auth('mfa.backup_codes_regenerated', { userId: user._id.toString() });
  return res.json({ backupCodes: backupCodes.plain });
}
