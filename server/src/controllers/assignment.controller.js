import { Class } from '../models/Class.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Mark } from '../models/Mark.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export async function createAssignment(req, res) {
  const { classId, subjectId, teacherId } = req.body;

  const [klass, subject, teacher] = await Promise.all([
    Class.findById(classId),
    Subject.findById(subjectId),
    User.findById(teacherId),
  ]);
  if (!klass) throw notFound('Class not found');
  if (!subject) throw notFound('Subject not found');
  if (!teacher || teacher.role !== 'teacher') throw badRequest('Teacher must be an existing teacher account');

  try {
    const assignment = await ClassSubject.create({ classId, subjectId, teacherId });
    await assignment.populate('classId subjectId teacherId');
    logger.info('assignment.created', {
      adminId: req.user._id.toString(),
      assignmentId: assignment._id.toString(),
    });
    return res.status(201).json({ assignment: assignment.toPublicJSON() });
  } catch (error) {
    if (error?.code === 11000) throw badRequest('That subject is already assigned to this class');
    throw error;
  }
}

export async function listAssignments(req, res) {
  const query = {};
  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.subjectId) query.subjectId = req.query.subjectId;
  if (req.query.teacherId) query.teacherId = req.query.teacherId;

  const assignments = await ClassSubject.find(query)
    .populate('classId subjectId teacherId')
    .sort({ createdAt: -1 });

  return res.json({ assignments: assignments.map((assignment) => assignment.toPublicJSON()) });
}

export async function deleteAssignment(req, res) {
  const assignment = await ClassSubject.findById(req.params.id);
  if (!assignment) throw notFound('Assignment not found');

  await Promise.all([
    Mark.deleteMany({ classSubjectId: assignment._id }),
    assignment.deleteOne(),
  ]);

  logger.info('assignment.deleted', {
    adminId: req.user._id.toString(),
    assignmentId: assignment._id.toString(),
  });
  return res.json({ message: 'Assignment deleted' });
}
