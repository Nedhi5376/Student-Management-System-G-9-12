import { User } from '../models/User.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function getMe(req, res) {
  if (req.user.role === 'student' && req.user.classId) {
    await req.user.populate('classId');
  }
  return res.json({ user: req.user.toPublicJSON() });
}

export async function searchUsers(req, res) {
  const query = {};
  if (req.query.role === 'student' || req.query.role === 'teacher') query.role = req.query.role;

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q) {
    const rx = new RegExp(escapeRegExp(q), 'i');
    query.$or = [{ name: rx }, { email: rx }, { nationalId: rx }, { rollNumber: rx }, { employeeId: rx }];
  }

  const users = await User.find(query).populate('classId').sort({ name: 1 }).limit(25);

  return res.json({ users: users.map((user) => user.toPublicJSON()) });
}
