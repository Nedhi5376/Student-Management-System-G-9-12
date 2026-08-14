import { HistoricalAcademicRecord } from '../models/HistoricalAcademicRecord.js';
import { User } from '../models/User.js';
import { broadcast } from '../services/eventBus.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

function calculateAggregates(subjects) {
  let totalObtained = 0;
  let totalMax = 0;
  for (const subj of subjects) {
    totalObtained += subj.mark;
    totalMax += subj.maxMark ?? 100;
  }
  const average = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;
  return { totalObtained, totalMax, average };
}

async function resolveStudentId(identifier) {
  if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
    const user = await User.findById(identifier).select('_id');
    if (!user || user.role !== 'student') throw badRequest('Student not found');
    return user._id;
  }
  const user = await User.findOne({ nationalId: identifier, role: 'student' }).select('_id');
  if (!user) throw badRequest('Student not found');
  return user._id;
}

export async function createHistoricalRecord(req, res) {
  const { studentId, ...fields } = req.body;

  const student = await resolveStudentId(studentId);

  const aggregates = calculateAggregates(fields.subjects);

  try {
    const record = await HistoricalAcademicRecord.create({
      ...fields,
      studentId: student,
      ...aggregates,
      createdBy: req.user._id,
    });
    await record.populate('createdBy', 'name');
    logger.info('historical-record.created', {
      adminId: req.user._id.toString(),
      recordId: record._id.toString(),
      studentId: student.toString(),
    });
    broadcast('historical-record.changed', { action: 'created', studentId: student.toString(), recordId: record._id.toString() }, student.toString());
    return res.status(201).json({ record: record.toPublicJSON() });
  } catch (error) {
    if (error?.code === 11000) {
      throw badRequest('A historical record for this student, academic year, grade, and section already exists');
    }
    throw error;
  }
}

export async function listHistoricalRecords(req, res) {
  const page = Math.max(Number.parseInt(req.query.page ?? '1', 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '20', 10) || 20, 1), 100);

  const query = {};
  if (req.query.studentId) query.studentId = req.query.studentId;
  if (req.query.academicYear) query.academicYear = req.query.academicYear;
  if (req.query.grade) query.grade = req.query.grade;
  if (req.query.source) query.source = req.query.source;

  const [records, total] = await Promise.all([
    HistoricalAcademicRecord.find(query)
      .populate('studentId', 'name nationalId rollNumber grade classId')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ academicYear: 1, grade: 1, section: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    HistoricalAcademicRecord.countDocuments(query),
  ]);

  return res.json({
    records: records.map((record) => record.toPublicJSON()),
    page,
    limit,
    total,
  });
}

export async function getHistoricalRecord(req, res) {
  const record = await HistoricalAcademicRecord.findById(req.params.id)
    .populate('studentId', 'name nationalId rollNumber grade classId')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');
  if (!record) throw notFound('Historical record not found');
  return res.json({ record: record.toPublicJSON() });
}

export async function getStudentAcademicHistory(req, res) {
  const { studentId } = req.params;
  const student = await resolveStudentId(studentId);

  const records = await HistoricalAcademicRecord.find({ studentId: student })
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .sort({ academicYear: 1, grade: 1, section: 1 });

  return res.json({ records: records.map((record) => record.toPublicJSON()) });
}

export async function updateHistoricalRecord(req, res) {
  const record = await HistoricalAcademicRecord.findById(req.params.id);
  if (!record) throw notFound('Historical record not found');

  const { studentId, ...fields } = req.body;

  if (studentId && studentId !== record.studentId.toString()) {
    const newStudentId = await resolveStudentId(studentId);
    record.studentId = newStudentId;
  }

  if (fields.subjects) {
    const aggregates = calculateAggregates(fields.subjects);
    record.totalObtained = aggregates.totalObtained;
    record.totalMax = aggregates.totalMax;
    record.average = aggregates.average;
  }

  Object.keys(fields).forEach((key) => {
    if (key !== 'studentId') record[key] = fields[key];
  });

  record.updatedBy = req.user._id;

  try {
    await record.save();
    await record.populate('createdBy', 'name');
    await record.populate('updatedBy', 'name');
    logger.info('historical-record.updated', {
      adminId: req.user._id.toString(),
      recordId: record._id.toString(),
    });
    broadcast('historical-record.changed', { action: 'updated', studentId: record.studentId.toString(), recordId: record._id.toString() }, record.studentId.toString());
    return res.json({ record: record.toPublicJSON() });
  } catch (error) {
    if (error?.code === 11000) {
      throw badRequest('A historical record for this student, academic year, grade, and section already exists');
    }
    throw error;
  }
}

export async function deleteHistoricalRecord(req, res) {
  const record = await HistoricalAcademicRecord.findById(req.params.id);
  if (!record) throw notFound('Historical record not found');

  await record.deleteOne();
  logger.info('historical-record.deleted', {
    adminId: req.user._id.toString(),
    recordId: req.params.id,
    studentId: record.studentId.toString(),
  });
  broadcast('historical-record.changed', { action: 'deleted', studentId: record.studentId.toString(), recordId: req.params.id }, record.studentId.toString());
  return res.json({ message: 'Historical record deleted' });
}