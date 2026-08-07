import mongoose from 'mongoose';
import { GRADES, currentAcademicYear } from '../utils/constants.js';

const classSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 30 },
    grade: { type: String, required: true, enum: GRADES },
    section: { type: String, required: true, trim: true, maxlength: 5, uppercase: true },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12,
      default: () => currentAcademicYear(),
    },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    roomNumber: { type: String, trim: true, maxlength: 20, default: null },
  },
  { timestamps: true },
);

classSchema.index({ grade: 1, section: 1, academicYear: 1 }, { unique: true });

classSchema.methods.toPublicJSON = function toPublicJSON() {
  const teacher = this.classTeacher && this.classTeacher.name ? this.classTeacher : null;
  return {
    id: this._id.toString(),
    name: this.name || `${this.grade}-${this.section}`,
    grade: this.grade,
    section: this.section,
    academicYear: this.academicYear,
    roomNumber: this.roomNumber,
    classTeacher: teacher
      ? { id: teacher._id.toString(), name: teacher.name }
      : this.classTeacher
        ? this.classTeacher.toString()
        : null,
    studentCount: this.studentCount ?? 0,
    createdAt: this.createdAt,
  };
};

export const Class = mongoose.model('Class', classSchema);
