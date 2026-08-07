export const ROLES = ['student', 'teacher', 'admin'];
export const GRADES = ['9', '10', '11', '12'];
export const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Final'];
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];

export function currentAcademicYear() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}
