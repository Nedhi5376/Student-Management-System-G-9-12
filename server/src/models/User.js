import mongoose from 'mongoose';
import { GRADES, ROLES } from '../utils/constants.js';

const backupCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true },
    usedAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Students are registered by an admin and often have no email; email is
    // therefore optional. The sparse index lets many accounts omit it.
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    // Omitted on purpose (no default null): a blank value leaves the field
    // missing so the sparse unique index allows many accounts without one.
    nationalId: { type: String, trim: true, maxlength: 30, unique: true, sparse: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'student', index: true },
    emailVerified: { type: Boolean, default: false },
    // Common profile fields
    gender: { type: String, enum: ['male', 'female'], default: null },
    dateOfBirth: { type: Date, default: null },
    phone: { type: String, trim: true, maxlength: 20, default: null },
    address: { type: String, trim: true, maxlength: 200, default: null },
    // Student fields
    grade: { type: String, enum: GRADES, default: null, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null, index: true },
    rollNumber: { type: String, trim: true, maxlength: 10, default: null },
    guardianName: { type: String, trim: true, maxlength: 80, default: null },
    guardianPhone: { type: String, trim: true, maxlength: 20, default: null },
    // Teacher fields
    employeeId: { type: String, trim: true, maxlength: 20, default: null },
    qualification: { type: String, trim: true, maxlength: 120, default: null },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpiresAt: { type: Date, default: null, select: false },
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null, select: false },
      pendingSecret: { type: String, default: null, select: false },
      backupCodes: { type: [backupCodeSchema], default: [], select: false },
    },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const profile = {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    emailVerified: this.emailVerified,
    mfaEnabled: Boolean(this.mfa?.enabled),
    gender: this.gender,
    dateOfBirth: this.dateOfBirth,
    phone: this.phone,
    address: this.address,
    createdAt: this.createdAt,
  };

  if (this.role === 'student') {
    const classDoc = this.classId && this.classId.name ? this.classId : null;
    profile.nationalId = this.nationalId;
    profile.grade = this.grade;
    profile.rollNumber = this.rollNumber;
    profile.guardianName = this.guardianName;
    profile.guardianPhone = this.guardianPhone;
    profile.class = classDoc
      ? { id: classDoc._id.toString(), name: classDoc.name }
      : this.classId
        ? this.classId.toString()
        : null;
  }

  if (this.role === 'teacher') {
    profile.nationalId = this.nationalId;
    profile.employeeId = this.employeeId;
    profile.qualification = this.qualification;
  }

  return profile;
};

export const User = mongoose.model('User', userSchema);
