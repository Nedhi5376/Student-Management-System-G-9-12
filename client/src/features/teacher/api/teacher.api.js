import { api } from '../../../lib/axiosInstance.js';

/** Assignments for the signed-in teacher, with per-class student counts: { assignments }. */
export const getMyAssignmentsRequest = () => api.get('/teacher/assignments').then((r) => r.data);

/** Full roster for one assignment: { assignment, students, marks }. */
export const getRosterRequest = (assignmentId) => api.get(`/teacher/assignments/${assignmentId}/roster`).then((r) => r.data);

/** Upserts a batch of marks for one term. */
export const saveMarksRequest = (payload) => api.post('/teacher/marks', payload).then((r) => r.data);

/** Marks for one assignment, optionally filtered by term. */
export const getMarksRequest = (params = {}) => api.get('/teacher/marks', { params }).then((r) => r.data);

/** Upserts attendance for one class + date. */
export const saveAttendanceRequest = (payload) => api.post('/teacher/attendance', payload).then((r) => r.data);

/** Existing attendance records for one class + date. */
export const getAttendanceRequest = (params = {}) => api.get('/teacher/attendance', { params }).then((r) => r.data);
