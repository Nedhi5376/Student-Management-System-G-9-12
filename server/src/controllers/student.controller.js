import { Attendance } from '../models/Attendance.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Mark } from '../models/Mark.js';
import { User } from '../models/User.js';

export async function getOverview(req, res) {
  const student = await User.findById(req.user._id).populate('classId');
  const classId = student.classId?._id;

  let subjects = [];
  let gradeSummary = [];
  const attendanceSummary = { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: null };

  if (classId) {
    const assignments = await ClassSubject.find({ classId })
      .populate('classId subjectId teacherId')
      .sort({ createdAt: 1 });

    subjects = assignments.map((assignment) => ({
      id: assignment.subjectId._id.toString(),
      name: assignment.subjectId.name,
      code: assignment.subjectId.code,
      assignmentId: assignment._id.toString(),
      teacher: assignment.teacherId ? { id: assignment.teacherId._id.toString(), name: assignment.teacherId.name } : null,
    }));
  }

  const marks = await Mark.find({ studentId: req.user._id })
    .populate({ path: 'classSubjectId', populate: { path: 'subjectId' } })
    .sort({ createdAt: -1 });

  const bySubject = new Map();
  for (const mark of marks) {
    const subject = mark.classSubjectId?.subjectId;
    if (!subject) continue;
    const key = subject._id.toString();
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        subject: { id: key, name: subject.name, code: subject.code },
        marks: [],
      });
    }
    bySubject.get(key).marks.push({
      term: mark.term,
      marksObtained: mark.marksObtained,
      maxMarks: mark.maxMarks,
      comment: mark.comment,
    });
  }

  gradeSummary = [...bySubject.values()].map(({ subject, marks: list }) => {
    const totalObtained = list.reduce((sum, mark) => sum + mark.marksObtained, 0);
    const totalMax = list.reduce((sum, mark) => sum + mark.maxMarks, 0);
    const average = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;
    return { subject, count: list.length, average, latest: list[0] };
  });

  const attendanceRecords = await Attendance.find({ studentId: req.user._id }).select('status').lean();
  for (const record of attendanceRecords) {
    if (attendanceSummary[record.status] !== undefined) attendanceSummary[record.status] += 1;
  }
  attendanceSummary.total = attendanceRecords.length;
  attendanceSummary.rate =
    attendanceRecords.length > 0
      ? Math.round((attendanceSummary.present / attendanceRecords.length) * 100)
      : null;

  return res.json({
    user: student.toPublicJSON(),
    class: student.classId
      ? { id: student.classId._id.toString(), name: student.classId.name, grade: student.classId.grade }
      : null,
    subjects,
    gradeSummary,
    attendanceSummary,
  });
}

export async function getGrades(req, res) {
  const marks = await Mark.find({ studentId: req.user._id })
    .populate({ path: 'classSubjectId', populate: { path: 'subjectId' } })
    .sort({ createdAt: -1 });

  return res.json({
    marks: marks.map((mark) => ({
      id: mark._id.toString(),
      subject: mark.classSubjectId?.subjectId
        ? {
            id: mark.classSubjectId.subjectId._id.toString(),
            name: mark.classSubjectId.subjectId.name,
            code: mark.classSubjectId.subjectId.code,
          }
        : null,
      term: mark.term,
      marksObtained: mark.marksObtained,
      maxMarks: mark.maxMarks,
      comment: mark.comment,
      recordedAt: mark.createdAt,
    })),
  });
}

export async function getAttendance(req, res) {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '60', 10) || 60, 1), 200);
  const records = await Attendance.find({ studentId: req.user._id }).sort({ date: -1 }).limit(limit);

  return res.json({
    records: records.map((record) => ({
      id: record._id.toString(),
      date: record.date,
      status: record.status,
    })),
  });
}
