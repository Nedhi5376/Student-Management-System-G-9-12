import mongoose from 'mongoose';
import { GRADES } from '../utils/constants.js';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
    grade: { type: String, required: true, enum: GRADES, index: true },
    description: { type: String, trim: true, maxlength: 300, default: null },
  },
  { timestamps: true },
);

subjectSchema.index({ code: 1, grade: 1 }, { unique: true });

subjectSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    code: this.code,
    grade: this.grade,
    description: this.description,
    createdAt: this.createdAt,
  };
};

export const Subject = mongoose.model('Subject', subjectSchema);
