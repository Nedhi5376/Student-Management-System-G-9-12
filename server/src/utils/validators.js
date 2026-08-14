import { z } from 'zod';
import { ATTENDANCE_STATUSES, GRADES, ROLES, TERMS } from './constants.js';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reference id');
const optionalMongoId = z.union([mongoId, z.literal('')]).optional().transform((value) => (value || null));

export const subjectMarkSchema = z.object({
  subject: z.string().trim().min(1, 'Subject name is required').max(80),
  mark: z.coerce.number().min(0, 'Mark cannot be negative').max(500),
  maxMark: z.coerce.number().min(1, 'Max mark must be at least 1').max(500).default(100).optional(),
});

export const historicalRecordSchema = z
  .object({
    studentId: optionalMongoId,
    nationalId: z.string().trim().min(1, 'National ID is required').max(50).optional().nullable(),
    academicYear: z.string().trim().min(1, 'Academic year is required').max(12),
    grade: z.enum(GRADES),
    section: z.string().trim().min(1, 'Section is required').max(5).toUpperCase(),
    subjects: z.array(subjectMarkSchema).min(1, 'At least one subject is required'),
    schoolInfo: z.string().trim().max(200).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

export const updateHistoricalRecordSchema = historicalRecordSchema.partial().extend({
  studentId: optionalMongoId,
});

export const historicalRecordQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  studentId: mongoId.optional(),
  academicYear: z.string().trim().max(12).optional(),
  grade: z.enum(GRADES).optional(),
  source: z.enum(['historical', 'system']).optional(),
});

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

const profileFields = {
  gender: z.enum(['male', 'female']).optional().nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
};

const requireStudentFields = (role, data, ctx) => {
  if (role === 'student') {
    if (!data.grade) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['grade'], message: 'Grade is required for students' });
    }
    if (!data.nationalId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nationalId'], message: 'National ID is required for students' });
    }
  }
};

const requireTeacherFields = (role, data, ctx) => {
  if (role === 'teacher' && !data.nationalId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nationalId'], message: 'National ID is required for teachers' });
  }
};

const userFields = {
  name: z.string().trim().min(2, 'Name is too short').max(80),
  // Email is optional: students registered by an admin may not have one.
  // Empty values become `undefined` so the sparse unique index treats the
  // account as "no email" instead of storing a conflicting `null`.
  email: z
    .union([emailSchema, z.literal('')])
    .optional()
    .transform((value) => (value || undefined)),
  nationalId: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((value) => (value || undefined)),
  role: z.enum(ROLES),
  grade: z.enum(GRADES).optional().nullable(),
  classId: optionalMongoId,
  rollNumber: z.string().trim().max(10).optional().nullable(),
  guardianName: z.string().trim().max(80).optional().nullable(),
  guardianPhone: z.string().trim().max(20).optional().nullable(),
  employeeId: z.string().trim().max(20).optional().nullable(),
  qualification: z.string().trim().max(120).optional().nullable(),
  ...profileFields,
};

export const createUserSchema = z
  // Password is optional: for students and teachers it defaults to their National ID.
  .object({ ...userFields, password: passwordSchema.optional() });

export const updateUserSchema = z
  .object(userFields)
  .partial()
  .extend({ password: passwordSchema.optional() })
  .superRefine((data, ctx) => {
    if (data.role) {
      requireStudentFields(data.role, data, ctx);
      requireTeacherFields(data.role, data, ctx);
    }
  });

export const classSchema = z.object({
  grade: z.enum(GRADES),
  section: z.string().trim().min(1, 'Section is required').max(5),
  academicYear: z.string().trim().max(12).optional(),
  classTeacher: optionalMongoId,
  roomNumber: z.string().trim().max(20).optional().nullable(),
});

export const updateClassSchema = classSchema.partial();

export const subjectSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  code: z.string().trim().min(1, 'Code is required').max(12),
  grade: z.enum(GRADES),
  description: z.string().trim().max(300).optional().nullable(),
});

export const updateSubjectSchema = subjectSchema.partial();

export const assignmentSchema = z.object({
  classId: mongoId,
  subjectId: mongoId,
  teacherId: mongoId,
});

export const marksSchema = z
  .object({
    classSubjectId: mongoId,
    term: z.enum(TERMS),
    entries: z
      .array(
        z.object({
          studentId: mongoId,
          marksObtained: z.coerce.number().min(0, 'Marks cannot be negative'),
          maxMarks: z.coerce.number().min(1, 'Max marks must be at least 1').max(500).optional(),
          comment: z.string().trim().max(200).optional().nullable(),
        }),
      )
      .min(1, 'Provide at least one entry'),
  })
  .superRefine((data, ctx) => {
    data.entries.forEach((entry, index) => {
      const max = entry.maxMarks ?? 100;
      if (entry.marksObtained > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', index, 'marksObtained'],
          message: `Marks cannot exceed ${max}`,
        });
      }
    });
  });

export const attendanceSchema = z.object({
  classId: mongoId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  entries: z
    .array(
      z.object({
        studentId: mongoId,
        status: z.enum(ATTENDANCE_STATUSES),
      }),
    )
    .min(1, 'Provide at least one entry'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or full name is required'),
  password: z.string().min(1, 'Password is required'),
});

export const totpSchema = z.object({
  mfaToken: z.string().min(1),
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$|^[A-Za-z0-9-]{8,32}$/, 'Enter a 6-digit code or a backup code'),
});

export const mfaEnableSchema = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/, 'Enter the 6-digit code from your authenticator app'),
});

export const mfaDisableSchema = z.object({
  password: z.string().min(1),
  code: z.string().trim().regex(/^[0-9]{6}$/, 'Enter the 6-digit code from your authenticator app'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
