import { Attendance } from '../models/Attendance.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { HistoricalAcademicRecord } from '../models/HistoricalAcademicRecord.js';
import { Mark } from '../models/Mark.js';
import { User } from '../models/User.js';
import { notFound } from '../utils/httpError.js';

function gradeSortKey(grade) {
  const order = { 9: 1, 10: 2, 11: 3, 12: 4 };
  return order[grade] ?? 99;
}

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

export async function getAcademicHistory(req, res) {
  const records = await HistoricalAcademicRecord.find({ studentId: req.user._id }).sort({ academicYear: 1, grade: 1, section: 1 });
  return res.json({
    records: records.map((record) => record.toPublicJSON()),
  });
}

export async function getTranscript(req, res) {
  const student = await User.findById(req.user._id).populate('classId');
  if (!student) throw notFound('Student not found');

  const historicalRecords = await HistoricalAcademicRecord.find({ studentId: req.user._id })
    .sort({ academicYear: 1, grade: 1, section: 1 });

  const currentMarks = await Mark.find({ studentId: req.user._id })
    .populate({ path: 'classSubjectId', populate: { path: 'subjectId' } })
    .sort({ createdAt: -1 });

  const currentByYear = new Map();
  for (const mark of currentMarks) {
    const subject = mark.classSubjectId?.subjectId;
    if (!subject) continue;
    const classSubject = mark.classSubjectId;
    const classDoc = classSubject.classId;
    const academicYear = classDoc?.academicYear || 'Current';
    const grade = classDoc?.grade || 'Unknown';
    const section = classDoc?.section || '';

    const key = `${academicYear}|${grade}|${section}`;
    if (!currentByYear.has(key)) {
      currentByYear.set(key, {
        academicYear,
        grade,
        section,
        source: 'system',
        subjects: [],
        classId: classDoc?._id.toString(),
        className: classDoc?.name,
      });
    }
    const yearData = currentByYear.get(key);
    const existingSubject = yearData.subjects.find((s) => s.subject === subject.name);
    if (existingSubject) {
      existingSubject.marks.push({ term: mark.term, marksObtained: mark.marksObtained, maxMarks: mark.maxMarks, comment: mark.comment });
    } else {
      yearData.subjects.push({
        subject: subject.name,
        subjectCode: subject.code,
        marks: [{ term: mark.term, marksObtained: mark.marksObtained, maxMarks: mark.maxMarks, comment: mark.comment }],
      });
    }
  }

  const currentRecords = [];
  for (const [, yearData] of currentByYear) {
    let totalObtained = 0;
    let totalMax = 0;
    for (const subj of yearData.subjects) {
      for (const m of subj.marks) {
        totalObtained += m.marksObtained;
        totalMax += m.maxMarks;
      }
    }
    const average = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;
    currentRecords.push({
      ...yearData,
      totalObtained,
      totalMax,
      average,
      subjects: yearData.subjects.map((s) => ({
        subject: s.subject,
        subjectCode: s.subjectCode,
        marks: s.marks,
        latestMark: s.marks[0]?.marksObtained,
        latestMax: s.marks[0]?.maxMarks,
        latestTerm: s.marks[0]?.term,
      })),
    });
  }

  const allRecords = [
    ...historicalRecords.map((r) => ({
      id: r._id.toString(),
      academicYear: r.academicYear,
      grade: r.grade,
      section: r.section,
      source: r.source,
      subjects: r.subjects.map((s) => ({ subject: s.subject, mark: s.mark, maxMark: s.maxMark ?? 100 })),
      totalObtained: r.totalObtained,
      totalMax: r.totalMax,
      average: r.average,
      schoolInfo: r.schoolInfo,
      notes: r.notes,
      createdAt: r.createdAt,
    })),
    ...currentRecords,
  ];

  allRecords.sort((a, b) => {
    const yearDiff = (a.academicYear || '').localeCompare(b.academicYear || '');
    if (yearDiff !== 0) return yearDiff;
    return gradeSortKey(a.grade) - gradeSortKey(b.grade);
  });

  return res.json({
    student: student.toPublicJSON(),
    transcript: allRecords,
  });
}
