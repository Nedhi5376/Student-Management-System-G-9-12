import { api } from '../../../lib/axiosInstance.js';

/** Creates a user (admin only). Students and teachers without a password get the National ID as their initial password. */
export const createUserRequest = (payload) => api.post('/admin/users', payload).then((r) => r.data);

export const listClassesRequest = (params = {}) => api.get('/admin/classes', { params }).then((r) => r.data);
export const createClassRequest = (payload) => api.post('/admin/classes', payload).then((r) => r.data);
export const updateClassRequest = (id, payload) => api.patch(`/admin/classes/${id}`, payload).then((r) => r.data);
export const deleteClassRequest = (id) => api.delete(`/admin/classes/${id}`).then((r) => r.data);

export const listSubjectsRequest = (params = {}) => api.get('/admin/subjects', { params }).then((r) => r.data);
export const createSubjectRequest = (payload) => api.post('/admin/subjects', payload).then((r) => r.data);
export const updateSubjectRequest = (id, payload) => api.patch(`/admin/subjects/${id}`, payload).then((r) => r.data);
export const deleteSubjectRequest = (id) => api.delete(`/admin/subjects/${id}`).then((r) => r.data);

export const listAssignmentsRequest = (params = {}) => api.get('/admin/assignments', { params }).then((r) => r.data);
export const createAssignmentRequest = (payload) => api.post('/admin/assignments', payload).then((r) => r.data);
export const deleteAssignmentRequest = (id) => api.delete(`/admin/assignments/${id}`).then((r) => r.data);
