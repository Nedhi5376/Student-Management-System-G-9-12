import multer from 'multer';
import XLSX from 'xlsx';
import { HistoricalAcademicRecord } from '../models/HistoricalAcademicRecord.js';
import { User } from '../models/User.js';
import { broadcast } from '../services/eventBus.js';
import { GRADES } from '../utils/constants.js';
import { badRequest } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  },
});

export const uploadHistoricalRecords = upload.single('file');

function parseFile(buffer, mimetype, originalname) {
  const ext = originalname.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || mimetype === 'text/csv') {
    const text = buffer.toString('utf-8');
    const workbook = XLSX.read(text, { type: 'string', FS: ',' });
    return workbook.SheetNames.map((name) => XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' })).flat();
  }
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames.map((name) => XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' })).flat();
}

function normalizeRow(row, index) {
  const get = (key) => {
    const val = row[key];
    if (val === undefined || val === null || val === '') return null;
    return String(val).trim();
  };

  const subjects = [];
  for (let i = 1; i <= 20; i++) {
    const subject = get(`subject${i}`) || get(`Subject${i}`) || get(`SUBJECT${i}`);
    const mark = get(`mark${i}`) || get(`Mark${i}`) || get(`MARK${i}`);
    const maxMark = get(`maxMark${i}`) || get(`MaxMark${i}`) || get(`MAXMARK${i}`);

    if (subject && mark !== null) {
      subjects.push({
        subject,
        mark: Number(mark),
        maxMark: maxMark ? Number(maxMark) : 100,
      });
    } else if (!subject && mark !== null) {
      return { error: `Row ${index + 1}: Subject name missing for mark ${mark}` };
    }
  }

  if (subjects.length === 0) {
    const subject = get('subject') || get('Subject') || get('SUBJECT');
    const mark = get('mark') || get('Mark') || get('MARK');
    const maxMark = get('maxMark') || get('MaxMark') || get('MAXMARK');
    if (subject && mark !== null) {
      subjects.push({ subject, mark: Number(mark), maxMark: maxMark ? Number(maxMark) : 100 });
    }
  }

  const studentId = get('studentId') || get('StudentId') || get('STUDENTID');
  const nationalId = get('nationalId') || get('NationalId') || get('NATIONALID');
  const academicYear = get('academicYear') || get('AcademicYear') || get('ACADEMICYEAR');
  const grade = get('grade') || get('Grade') || get('GRADE');
  const section = get('section') || get('Section') || get('SECTION');
  const schoolInfo = get('schoolInfo') || get('SchoolInfo') || get('SCHOOLINFO');
  const notes = get('notes') || get('Notes') || get('NOTES');

  return {
    studentId,
    nationalId,
    academicYear,
    grade,
    section: section?.toUpperCase(),
    subjects,
    schoolInfo,
    notes,
    rowIndex: index,
  };
}

async function resolveStudent(identifier, nationalId) {
  if (identifier) {
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      const user = await User.findById(identifier).select('_id nationalId name');
      if (!user || user.role !== 'student') return { error: 'Student not found' };
      return { student: user };
    }
    const user = await User.findOne({ nationalId: identifier, role: 'student' }).select('_id nationalId name');
    if (user) return { student: user };
  }
  if (nationalId) {
    const user = await User.findOne({ nationalId, role: 'student' }).select('_id nationalId name');
    if (user) return { student: user };
  }
  return { error: 'Student not found. Provide valid studentId or nationalId.' };
}

function validateRecord(record, existingKeys) {
  const errors = [];

  if (!record.studentId && !record.nationalId) {
    errors.push('Missing student ID or national ID');
  }

  if (!record.academicYear) {
    errors.push('Missing academic year');
  }

  if (!record.grade || !GRADES.includes(record.grade)) {
    errors.push(`Invalid grade: ${record.grade}. Must be one of ${GRADES.join(', ')}`);
  }

  if (!record.section) {
    errors.push('Missing section');
  }

  if (!record.subjects || record.subjects.length === 0) {
    errors.push('At least one subject with mark is required');
  }

  for (const subj of record.subjects || []) {
    if (!subj.subject) errors.push('Subject name is required');
    if (subj.mark === undefined || subj.mark === null || isNaN(subj.mark)) errors.push(`Invalid mark for ${subj.subject || 'unknown subject'}`);
    if (subj.mark < 0 || subj.mark > 500) errors.push(`Mark out of range (0-500) for ${subj.subject || 'unknown subject'}`);
    if (subj.maxMark !== undefined && (subj.maxMark < 1 || subj.maxMark > 500)) errors.push(`Max mark out of range (1-500) for ${subj.subject || 'unknown subject'}`);
  }

  const recordKey = `${record.studentId || record.nationalId}|${record.academicYear}|${record.grade}|${record.section}`;
  if (existingKeys.has(recordKey)) {
    errors.push('Duplicate record for this student, academic year, grade, and section');
  }
  existingKeys.add(recordKey);

  return { errors };
}

export async function previewImport(req, res) {
  if (!req.file) throw badRequest('No file uploaded');

  const rows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
  if (rows.length === 0) throw badRequest('File is empty or could not be parsed');

  const existingKeys = new Set();
  const studentMap = new Map();
  const preview = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeRow(rows[i], i);
    if (normalized.error) {
      preview.push({
        row: i + 1,
        valid: false,
        errors: [normalized.error],
        data: null,
      });
      invalidCount++;
      continue;
    }

    let studentInfo = null;
    const identifier = normalized.studentId || normalized.nationalId;
    if (!studentMap.has(identifier)) {
      studentInfo = await resolveStudent(normalized.studentId, normalized.nationalId);
      studentMap.set(identifier, studentInfo);
    } else {
      studentInfo = studentMap.get(identifier);
    }

    const { errors } = validateRecord(normalized, existingKeys);

    if (errors.length === 0 && studentInfo?.student) {
      normalized.studentId = studentInfo.student._id.toString();
      normalized.studentName = studentInfo.student.name;
      normalized.studentNationalId = studentInfo.student.nationalId;
      validCount++;
    } else {
      if (!studentInfo?.student) errors.push(studentInfo?.error || 'Student not found');
      invalidCount++;
    }

    preview.push({
      row: i + 1,
      valid: errors.length === 0 && !!studentInfo?.student,
      errors,
      data: errors.length === 0 ? normalized : null,
    });
  }

  return res.json({
    preview,
    summary: { total: rows.length, valid: validCount, invalid: invalidCount },
  });
}

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

export async function confirmImport(req, res) {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) throw badRequest('No records to import');

  const existingKeys = new Set();
  const validRecords = [];
  const errors = [];

  for (const record of records) {
    const { errors: validationErrors } = validateRecord(record, existingKeys);
    if (validationErrors.length > 0) {
      errors.push({ record, errors: validationErrors });
      continue;
    }

    const aggregates = calculateAggregates(record.subjects);
    validRecords.push({
      studentId: record.studentId,
      academicYear: record.academicYear,
      grade: record.grade,
      section: record.section,
      subjects: record.subjects,
      schoolInfo: record.schoolInfo,
      notes: record.notes,
      source: 'historical',
      ...aggregates,
      createdBy: req.user._id,
    });
  }

  if (validRecords.length === 0) {
    return res.status(400).json({ message: 'No valid records to import', errors, imported: 0 });
  }

  let imported = 0;
  const failed = [];

  for (const record of validRecords) {
    try {
      const created = await HistoricalAcademicRecord.create(record);
      broadcast('historical-record.changed', { action: 'created', studentId: record.studentId, recordId: created._id.toString() }, record.studentId);
      imported++;
    } catch (error) {
      if (error?.code === 11000) {
        failed.push({ record, error: 'Duplicate record for this student, academic year, grade, and section' });
      } else {
        failed.push({ record, error: error.message });
      }
    }
  }

  logger.info('historical-record.imported', {
    adminId: req.user._id.toString(),
    imported,
    failed: failed.length,
    total: records.length,
  });

  return res.json({
    message: `Import completed. ${imported} records imported, ${failed.length} failed.`,
    imported,
    failed: failed.length,
    errors: [...errors, ...failed],
  });
}