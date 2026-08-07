import { ClassSubject } from '../models/ClassSubject.js';
import { Mark } from '../models/Mark.js';
import { Subject } from '../models/Subject.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export async function createSubject(req, res) {
  try {
    const subject = await Subject.create(req.body);
    logger.info('subject.created', { adminId: req.user._id.toString(), subjectId: subject._id.toString() });
    return res.status(201).json({ subject: subject.toPublicJSON() });
  } catch (error) {
    if (error?.code === 11000) throw badRequest('A subject with that code already exists for this grade');
    throw error;
  }
}

export async function listSubjects(req, res) {
  const query = {};
  if (req.query.grade) query.grade = req.query.grade;
  const subjects = await Subject.find(query).sort({ grade: 1, code: 1 });
  return res.json({ subjects: subjects.map((subject) => subject.toPublicJSON()) });
}

export async function updateSubject(req, res) {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw notFound('Subject not found');

  Object.keys(req.body).forEach((key) => {
    subject[key] = req.body[key];
  });

  try {
    await subject.save();
  } catch (error) {
    if (error?.code === 11000) throw badRequest('A subject with that code already exists for this grade');
    throw error;
  }

  logger.info('subject.updated', { adminId: req.user._id.toString(), subjectId: subject._id.toString() });
  return res.json({ subject: subject.toPublicJSON() });
}

export async function deleteSubject(req, res) {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw notFound('Subject not found');

  const assignments = await ClassSubject.find({ subjectId: subject._id }).select('_id');
  const assignmentIds = assignments.map((assignment) => assignment._id);

  await Promise.all([
    ClassSubject.deleteMany({ subjectId: subject._id }),
    Mark.deleteMany({ classSubjectId: { $in: assignmentIds } }),
    subject.deleteOne(),
  ]);

  logger.info('subject.deleted', { adminId: req.user._id.toString(), subjectId: subject._id.toString() });
  return res.json({ message: 'Subject deleted' });
}
