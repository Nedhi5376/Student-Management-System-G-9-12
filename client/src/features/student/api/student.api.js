import { api } from '../../../lib/axiosInstance.js';

/** Student overview: { user, class, subjects, gradeSummary, attendanceSummary }. */
export const getStudentOverviewRequest = () => api.get('/student/overview').then((r) => r.data);

/** Per-term marks for every assigned subject: { marks }. */
export const getGradesRequest = () => api.get('/student/grades').then((r) => r.data);

/** Attendance history, most recent first: { records }. */
export const getAttendanceRequest = (params = {}) => api.get('/student/attendance', { params }).then((r) => r.data);

/** Academic history from historical records: { records }. */
export const getAcademicHistoryRequest = () => api.get('/student/academic-history').then((r) => r.data);

/** Complete transcript with historical and current records: { student, transcript }. */
export const getTranscriptRequest = () => api.get('/student/transcript').then((r) => r.data);
