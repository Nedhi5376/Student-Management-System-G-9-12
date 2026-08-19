import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { Attendance } from '../models/Attendance.js';
import { Class } from '../models/Class.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Mark } from '../models/Mark.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { revokeAllForUser } from '../services/token.service.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function createUser(req, res) {
  const { password, ...fields } = req.body;

  if (!fields.classId) fields.classId = null;
  // Leave nationalId/email absent (not null) so the sparse unique indexes allow
  // many accounts without a value instead of colliding on the first null.
  if (!fields.nationalId) fields.nationalId = undefined;
  if (!fields.email) fields.email = undefined;

  const dupQuery = [];
  if (fields.email) dupQuery.push({ email: fields.email });
  if (fields.nationalId) dupQuery.push({ nationalId: fields.nationalId });
  if (dupQuery.length > 0) {
    const existing = await User.findOne({ $or: dupQuery });
    if (existing) throw badRequest('A user with that email or National ID already exists');
  }

  let passwordHash;
  let generatedPassword = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  } else if (fields.role === 'student') {
    // Students use common student password
    passwordHash = await bcrypt.hash(env.studentCommonPassword, env.BCRYPT_SALT_ROUNDS);
    generatedPassword = env.studentCommonPassword;
  } else if (fields.role === 'teacher') {
    // Teachers use common teacher password
    passwordHash = await bcrypt.hash(env.teacherCommonPassword, env.BCRYPT_SALT_ROUNDS);
    generatedPassword = env.teacherCommonPassword;
  } else {
    throw badRequest('A password is required for this account');
  }

  try {
    const user = await User.create({ ...fields, passwordHash, emailVerified: true });
    if (user.classId) await user.populate('classId');

    logger.auth('user.created', { adminId: req.user._id.toString(), userId: user._id.toString(), role: user.role });
    return res.status(201).json({
      user: user.toPublicJSON(),
      password: generatedPassword,
    });
  } catch (error) {
    if (error?.code === 11000) throw badRequest('A user with that email or National ID already exists');
    throw error;
  }
}

export async function listUsers(req, res) {
  const page = Math.max(Number.parseInt(req.query.page ?? '1', 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '20', 10) || 20, 1), 100);

  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.grade) query.grade = req.query.grade;
  if (req.query.search) {
    const rx = new RegExp(escapeRegExp(req.query.search), 'i');
    query.$or = [{ name: rx }, { email: rx }, { nationalId: rx }, { rollNumber: rx }, { employeeId: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('classId'),
    User.countDocuments(query),
  ]);

  return res.json({ users: users.map((user) => user.toPublicJSON()), page, limit, total });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id).populate('classId');
  if (!user) throw notFound('User not found');
  return res.json({ user: user.toPublicJSON() });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');

  const { password, role, ...fields } = req.body;
  const originalNationalId = user.nationalId;

  if (role && role !== user.role && user._id.equals(req.user._id)) {
    throw badRequest('You cannot change your own role');
  }

  if (user.role === 'admin' && role && role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw badRequest('Cannot demote the last remaining admin');
  }

  for (const key of Object.keys(fields)) user[key] = fields[key];

  if (role) {
    if (role !== 'student') {
      user.grade = null;
      user.classId = null;
      user.rollNumber = null;
      user.guardianName = null;
      user.guardianPhone = null;
    }
    if (role === 'admin') user.nationalId = undefined;
    if (role !== 'teacher') {
      user.employeeId = null;
      user.qualification = null;
    }
    user.role = role;
  }

  if (password) {
    user.passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  } else if (
    (user.role === 'student' || user.role === 'teacher') &&
    fields.nationalId &&
    fields.nationalId !== originalNationalId
  ) {
    // The National ID doubles as the initial password; keep them in sync.
    user.passwordHash = await bcrypt.hash(fields.nationalId, env.BCRYPT_SALT_ROUNDS);
  }

  await user.save();
  if (user.classId) await user.populate('classId');

  logger.auth('user.updated', { adminId: req.user._id.toString(), userId: user._id.toString(), role: user.role });
  return res.json({ user: user.toPublicJSON() });
}

export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');

  if (user._id.equals(req.user._id)) throw badRequest('You cannot delete your own account');

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw badRequest('Cannot delete the last remaining admin');
  }

  if (user.role === 'student') {
    await Promise.all([
      Mark.deleteMany({ studentId: user._id }),
      Attendance.deleteMany({ studentId: user._id }),
    ]);
  }

  if (user.role === 'teacher') {
    const assignments = await ClassSubject.find({ teacherId: user._id }).select('_id');
    const assignmentIds = assignments.map((assignment) => assignment._id);
    await Promise.all([
      ClassSubject.deleteMany({ teacherId: user._id }),
      Class.updateMany({ classTeacher: user._id }, { $set: { classTeacher: null } }),
      ...(assignmentIds.length > 0
        ? [Mark.deleteMany({ $or: assignmentIds.map((assignmentId) => ({ classSubjectId: assignmentId })) })]
        : []),
    ]);
  }

  await revokeAllForUser(user._id);
  await user.deleteOne();

  logger.auth('user.deleted', { adminId: req.user._id.toString(), userId: user._id.toString() });
  return res.json({ message: 'User deleted' });
}

export async function getStats(_req, res) {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    verified,
    unverified,
    mfaEnabled,
    students,
    teachers,
    admins,
    classes,
    subjects,
    assignments,
    marks,
    createdLast7Days,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ emailVerified: false }),
    User.countDocuments({ 'mfa.enabled': true }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    Class.countDocuments(),
    Subject.countDocuments(),
    ClassSubject.countDocuments(),
    Mark.countDocuments(),
    User.countDocuments({ createdAt: { $gte: last7Days } }),
  ]);

  return res.json({
    stats: {
      total,
      verified,
      unverified,
      mfaEnabled,
      admins,
      createdLast7Days,
      students,
      teachers,
      classes,
      subjects,
      assignments,
      marks,
    },
  });
}
