import { User } from '../models/User.js';

export async function getMe(req, res) {
  return res.json({ user: req.user.toPublicJSON() });
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
