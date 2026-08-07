import mongoose from 'mongoose';
import { TERMS } from '../utils/constants.js';

const markSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    classSubjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSubject', required: true, index: true },
    term: { type: String, required: true, enum: TERMS },
    marksObtained: { type: Number, required: true, min: 0, max: 500 },
    maxMarks: { type: Number, required: true, min: 1, max: 500, default: 100 },
    comment: { type: String, trim: true, maxlength: 200, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

markSchema.index({ studentId: 1, classSubjectId: 1, term: 1 }, { unique: true });

export const Mark = mongoose.model('Mark', markSchema);
