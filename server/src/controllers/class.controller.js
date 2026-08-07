import { Attendance } from '../models/Attendance.js';
import { Class } from '../models/Class.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Mark } from '../models/Mark.js';
import { User } from '../models/User.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

async function resolveClassTeacher(id) {
  if (!id) return null;
  const teacher = await User.findById(id);
  if (!teacher || teacher.role !== 'teacher') throw badRequest('Class teacher must be an existing teacher account');
  return teacher._id;
}

async function attachStudentCounts(classes) {
  const counts = await User.aggregate([
    { $match: { role: 'student', classId: { $ne: null } } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
  return classes.map((klass) => {
    const doc = klass;
    doc.studentCount = map.get(klass._id.toString()) ?? 0;
    return doc;
  });
}

export async function createClass(req, res) {
  const { classTeacher, ...fields } = req.body;
  const teacherId = await resolveClassTeacher(classTeacher);

  try {
    const klass = await Class.create({ ...fields, name: fields.section ? `${fields.grade}-${fields.section}` : undefined, classTeacher: teacherId });
    if (klass.classTeacher) await klass.populate('classTeacher', 'name');
    logger.info('class.created', { adminId: req.user._id.toString(), classId: klass._id.toString() });
    return res.status(201).json({ class: klass.toPublicJSON() });
  } catch (error) {
    if (error?.code === 11000) throw badRequest('A class with that grade, section and academic year already exists');
    throw error;
  }
}

export async function listClasses(req, res) {
  const query = {};
  if (req.query.grade) query.grade = req.query.grade;

  const classes = await Class.find(query).populate('classTeacher', 'name').sort({ grade: 1, section: 1 });
  const withCounts = await attachStudentCounts(classes);
  return res.json({ classes: withCounts.map((klass) => klass.toPublicJSON()) });
}

export async function getClass(req, res) {
  const klass = await Class.findById(req.params.id).populate('classTeacher', 'name');
  if (!klass) throw notFound('Class not found');
  const studentCount = await User.countDocuments({ role: 'student', classId: klass._id });
  const doc = klass;
  doc.studentCount = studentCount;
  return res.json({ class: doc.toPublicJSON() });
}

export async function listClassStudents(req, res) {
  const klass = await Class.findById(req.params.id);
  if (!klass) throw notFound('Class not found');
  const students = await User.find({ role: 'student', classId: klass._id }).sort({ rollNumber: 1 });
  return res.json({ students: students.map((student) => student.toPublicJSON()) });
}

export async function updateClass(req, res) {
  const klass = await Class.findById(req.params.id);
  if (!klass) throw notFound('Class not found');

  const { classTeacher, ...fields } = req.body;
  if (Object.keys(fields).length > 0) {
    if (fields.name === undefined && fields.section) fields.name = `${fields.grade ?? klass.grade}-${fields.section}`;
    Object.keys(fields).forEach((key) => {
      klass[key] = fields[key];
    });
  }
  if (classTeacher !== undefined) klass.classTeacher = await resolveClassTeacher(classTeacher);

  try {
    await klass.save();
  } catch (error) {
    if (error?.code === 11000) throw badRequest('A class with that grade, section and academic year already exists');
    throw error;
  }

  if (klass.classTeacher) await klass.populate('classTeacher', 'name');
  logger.info('class.updated', { adminId: req.user._id.toString(), classId: klass._id.toString() });
  return res.json({ class: klass.toPublicJSON() });
}

export async function deleteClass(req, res) {
  const klass = await Class.findById(req.params.id);
  if (!klass) throw notFound('Class not found');

  const assignments = await ClassSubject.find({ classId: klass._id }).select('_id');
  const assignmentIds = assignments.map((assignment) => assignment._id);

  await Promise.all([
    ClassSubject.deleteMany({ classId: klass._id }),
    Mark.deleteMany({ classSubjectId: { $in: assignmentIds } }),
    Attendance.deleteMany({ classId: klass._id }),
    User.updateMany({ classId: klass._id }, { $set: { classId: null } }),
    klass.deleteOne(),
  ]);

  logger.info('class.deleted', { adminId: req.user._id.toString(), classId: klass._id.toString() });
  return res.json({ message: 'Class deleted' });
}
