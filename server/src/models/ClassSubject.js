import mongoose from 'mongoose';

/** A teaching assignment: a teacher is assigned to teach one subject in one class. */
const classSubjectSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

classSubjectSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

classSubjectSchema.methods.toPublicJSON = function toPublicJSON() {
  const klass = this.classId && this.classId.name ? this.classId : null;
  const subject = this.subjectId && this.subjectId.name ? this.subjectId : null;
  const teacher = this.teacherId && this.teacherId.name ? this.teacherId : null;
  return {
    id: this._id.toString(),
    class: klass ? { id: klass._id.toString(), name: klass.name, grade: klass.grade } : null,
    subject: subject ? { id: subject._id.toString(), name: subject.name, code: subject.code } : null,
    teacher: teacher ? { id: teacher._id.toString(), name: teacher.name } : null,
    createdAt: this.createdAt,
  };
};

export const ClassSubject = mongoose.model('ClassSubject', classSubjectSchema);
