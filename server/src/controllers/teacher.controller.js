import { Attendance } from '../models/Attendance.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Mark } from '../models/Mark.js';
import { User } from '../models/User.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

async function assertOwnsAssignment(teacherId, classSubjectId) {
  const assignment = await ClassSubject.findById(classSubjectId);
  if (!assignment) throw notFound('Assignment not found');
  if (!assignment.teacherId.equals(teacherId)) throw forbidden('You do not teach this subject in this class');
  return assignment;
}

async function assertTeachesClass(teacherId, classId) {
  const exists = await ClassSubject.exists({ teacherId, classId });
  if (!exists) throw forbidden('You do not teach in this class');
}

export async function getMyAssignments(req, res) {
  const assignments = await ClassSubject.find({ teacherId: req.user._id })
    .populate('classId subjectId')
    .sort({ createdAt: -1 });

  const classIds = [...new Set(assignments.map((a) => a.classId?._id).filter(Boolean))];
  const counts = await User.aggregate([
    { $match: { role: 'student', classId: { $in: classIds } } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));

  const payload = assignments.map((assignment) => {
    const doc = assignment.toPublicJSON();
    return { ...doc, studentCount: countMap.get(doc.class?.id) ?? 0 };
  });

  return res.json({ assignments: payload });
}

export async function getRoster(req, res) {
  const assignment = await assertOwnsAssignment(req.user._id, req.params.id);
  await assignment.populate('classId subjectId');

  const students = await User.find({ role: 'student', classId: assignment.classId._id }).sort({
    rollNumber: 1,
    name: 1,
  });

  const marks = await Mark.find({ classSubjectId: assignment._id });

  return res.json({
    assignment: assignment.toPublicJSON(),
    students: students.map((student) => student.toPublicJSON()),
    marks: marks.map((mark) => ({
      id: mark._id.toString(),
      studentId: mark.studentId.toString(),
      term: mark.term,
      marksObtained: mark.marksObtained,
      maxMarks: mark.maxMarks,
      comment: mark.comment,
    })),
  });
}

export async function saveMarks(req, res) {
  const { classSubjectId, term, entries } = req.body;
  const assignment = await assertOwnsAssignment(req.user._id, classSubjectId);
  const classId = assignment.classId;

  const students = await User.find({ role: 'student', classId }).select('_id');
  const studentIds = new Set(students.map((student) => student._id.toString()));
  for (const entry of entries) {
    if (!studentIds.has(entry.studentId)) throw badRequest('Cannot record marks for a student not in this class');
  }

  await Mark.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: { studentId: entry.studentId, classSubjectId, term },
        update: {
          $set: {
            marksObtained: entry.marksObtained,
            // Only overwrite maxMarks when the teacher supplied one, otherwise a
            // partial resubmission would silently reset a custom value to 100.
            ...(entry.maxMarks != null ? { maxMarks: entry.maxMarks } : {}),
            comment: entry.comment ?? null,
            recordedBy: req.user._id,
          },
        },
        upsert: true,
      },
    })),
  );

  logger.auth('marks.saved', { teacherId: req.user._id.toString(), classSubjectId, term, count: entries.length });
  return res.json({ message: `${entries.length} mark${entries.length === 1 ? '' : 's'} saved`, saved: entries.length });
}

export async function listMarks(req, res) {
  const { classSubjectId, term } = req.query;
  if (!classSubjectId) throw badRequest('classSubjectId is required');
  await assertOwnsAssignment(req.user._id, classSubjectId);

  const query = { classSubjectId };
  if (term) query.term = term;

  const marks = await Mark.find(query).populate('studentId', 'name rollNumber').sort({ createdAt: -1 });
  return res.json({
    marks: marks.map((mark) => ({
      id: mark._id.toString(),
      student: { id: mark.studentId._id.toString(), name: mark.studentId.name, rollNumber: mark.studentId.rollNumber },
      term: mark.term,
      marksObtained: mark.marksObtained,
      maxMarks: mark.maxMarks,
      comment: mark.comment,
    })),
  });
}

export async function saveAttendance(req, res) {
  const { classId, date, entries } = req.body;
  await assertTeachesClass(req.user._id, classId);

  const students = await User.find({ role: 'student', classId }).select('_id');
  const studentIds = new Set(students.map((student) => student._id.toString()));
  for (const entry of entries) {
    if (!studentIds.has(entry.studentId)) throw badRequest('Cannot record attendance for a student not in this class');
  }

  await Attendance.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: { studentId: entry.studentId, classId, date },
        update: { $set: { status: entry.status, recordedBy: req.user._id } },
        upsert: true,
      },
    })),
  );

  logger.auth('attendance.saved', { teacherId: req.user._id.toString(), classId, date, count: entries.length });
  return res.json({ message: `Attendance recorded for ${entries.length} students`, saved: entries.length });
}

export async function listAttendance(req, res) {
  const { classId, date } = req.query;
  if (!classId) throw badRequest('classId is required');
  await assertTeachesClass(req.user._id, classId);

  const query = { classId };
  if (date) query.date = date;

  const records = await Attendance.find(query)
    .populate('studentId', 'name rollNumber')
    .sort({ date: -1, createdAt: -1 });

  return res.json({
    records: records.map((record) => ({
      id: record._id.toString(),
      student: {
        id: record.studentId._id.toString(),
        name: record.studentId.name,
        rollNumber: record.studentId.rollNumber,
      },
      date: record.date,
      status: record.status,
    })),
  });
}
