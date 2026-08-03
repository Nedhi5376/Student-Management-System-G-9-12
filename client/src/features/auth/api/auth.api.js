import { api } from '../../../lib/axiosInstance.js';

export const registerRequest = (payload) => api.post('/auth/register', payload).then((r) => r.data);
export const loginRequest = (payload) => api.post('/auth/login', payload).then((r) => r.data);
export const verifyMfaRequest = (payload) => api.post('/auth/mfa/verify', payload).then((r) => r.data);
export const logoutRequest = () => api.post('/auth/logout').then((r) => r.data);
export const meRequest = () => api.get('/users/me').then((r) => r.data);
export const setupMfaRequest = () => api.post('/auth/mfa/setup').then((r) => r.data);
export const enableMfaRequest = (payload) => api.post('/auth/mfa/enable', payload).then((r) => r.data);
export const disableMfaRequest = (payload) => api.post('/auth/mfa/disable', payload).then((r) => r.data);
export const listUsersRequest = () => api.get('/admin/users').then((r) => r.data);

export function extractErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error?.message ?? fallback;
}
