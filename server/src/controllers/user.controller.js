import { User } from '../models/User.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export async function getMe(req, res) {
  return res.json({ user: req.user.toPublicJSON() });
}

export async function updateUserRole(req, res) {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');

  if (user._id.equals(req.user._id) && role !== 'admin') {
    throw badRequest('You cannot change your own role');
  }

  if (user.role === 'admin' && role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw badRequest('Cannot demote the last remaining admin');
  }

  user.role = role;
  await user.save();
  logger.auth('role.updated', { adminId: req.user._id.toString(), userId: user._id.toString(), role });

  return res.json({ user: user.toPublicJSON() });
}

export async function listUsers(req, res) {
  const page = Math.max(Number.parseInt(req.query.page ?? '1', 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '20', 10) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);

  return res.json({ users: users.map((user) => user.toPublicJSON()), page, limit, total });
}

export async function getStats(_req, res) {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    total,
    verified,
    unverified,
    mfaEnabled,
    admins,
    standard,
    createdLast7Days,
    createdLast30Days,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ emailVerified: false }),
    User.countDocuments({ 'mfa.enabled': true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ createdAt: { $gte: last7Days } }),
    User.countDocuments({ createdAt: { $gte: last30Days } }),
  ]);

  return res.json({
    stats: {
      total,
      verified,
      unverified,
      mfaEnabled,
      admins,
      standard,
      createdLast7Days,
      createdLast30Days,
    },
  });
}
