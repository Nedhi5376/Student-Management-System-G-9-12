import mongoose from 'mongoose';
import { GRADES } from '../utils/constants.js';

const subjectMarkSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 80 },
    mark: { type: Number, required: true, min: 0, max: 500 },
    maxMark: { type: Number, min: 1, max: 500, default: 100 },
  },
  { _id: false },
);

const historicalAcademicRecordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    academicYear: { type: String, required: true, trim: true, maxlength: 12 },
    grade: { type: String, required: true, enum: GRADES, index: true },
    section: { type: String, required: true, trim: true, maxlength: 5, uppercase: true },
    subjects: { type: [subjectMarkSchema], required: true, validate: [(arr) => arr.length > 0, 'At least one subject is required'] },
    average: { type: Number, min: 0, max: 100, default: null },
    totalObtained: { type: Number, min: 0, default: null },
    totalMax: { type: Number, min: 1, default: null },
    schoolInfo: { type: String, trim: true, maxlength: 200, default: null },
    source: { type: String, enum: ['historical', 'system'], required: true, default: 'historical', index: true },
    notes: { type: String, trim: true, maxlength: 500, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

historicalAcademicRecordSchema.index(
  { studentId: 1, academicYear: 1, grade: 1, section: 1 },
  { unique: true },
);

historicalAcademicRecordSchema.methods.toPublicJSON = function toPublicJSON() {
  const createdBy = this.createdBy && this.createdBy.name ? this.createdBy : null;
  const updatedBy = this.updatedBy && this.updatedBy.name ? this.updatedBy : null;
  return {
    id: this._id.toString(),
    studentId: this.studentId.toString(),
    academicYear: this.academicYear,
    grade: this.grade,
    section: this.section,
    subjects: this.subjects,
    average: this.average,
    totalObtained: this.totalObtained,
    totalMax: this.totalMax,
    schoolInfo: this.schoolInfo,
    source: this.source,
    notes: this.notes,
    createdBy: createdBy
      ? { id: createdBy._id.toString(), name: createdBy.name }
      : this.createdBy
      ? this.createdBy.toString()
      : null,
    updatedBy: updatedBy
      ? { id: updatedBy._id.toString(), name: updatedBy.name }
      : this.updatedBy
      ? this.updatedBy.toString()
      : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const HistoricalAcademicRecord = mongoose.model('HistoricalAcademicRecord', historicalAcademicRecordSchema);