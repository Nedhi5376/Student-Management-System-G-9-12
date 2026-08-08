import { api } from '../../../lib/axiosInstance.js';

/** Registers a new account. Always returns the generic message — never reveals whether an email already exists. */
export const registerRequest = (payload) => api.post('/auth/register', payload).then((r) => r.data);

/** Consumes an email verification link; resolves to { message } on success. */
export const verifyEmailRequest = (token) => api.get('/auth/verify-email', { params: { token } }).then((r) => r.data);

/** Step 1 of sign-in. Resolves to a session or { mfaRequired, mfaToken }. */
export const loginRequest = (payload) => api.post('/auth/login', payload).then((r) => r.data);

/** Step 2 of sign-in: confirms a TOTP or single-use backup code. */
export const verifyMfaRequest = (payload) => api.post('/auth/mfa/verify', payload).then((r) => r.data);

/** Revokes the current refresh token. Refresh cookies are sent automatically. */
export const logoutRequest = () => api.post('/auth/logout').then((r) => r.data);

/** Returns the signed-in user's public profile. */
export const meRequest = () => api.get('/users/me').then((r) => r.data);

/** Generates a pending MFA secret plus QR image data (stored server-side until verified). */
export const setupMfaRequest = () => api.post('/auth/mfa/setup').then((r) => r.data);

/** Confirms the pairing code and enables MFA; returns single-use backup codes. */
export const enableMfaRequest = (payload) => api.post('/auth/mfa/enable', payload).then((r) => r.data);

/** Disables MFA, requiring the password and a current code. */
export const disableMfaRequest = (payload) => api.post('/auth/mfa/disable', payload).then((r) => r.data);

/** Changes the signed-in user's password. All existing sessions are revoked. */
export const changePasswordRequest = (payload) => api.post('/auth/change-password', payload).then((r) => r.data);

/** Lists users (admin only) with server-side pagination: { users, page, limit, total }. */
export const listUsersRequest = (params = {}) => api.get('/admin/users', { params }).then((r) => r.data);

/** Updates a user's role (admin only). `role` is one of 'student' | 'teacher' | 'admin'. */
export const updateUserRoleRequest = (id, role) =>
  api.patch(`/admin/users/${id}`, { role }).then((r) => r.data);

/** Returns aggregate account counts (admin only): { stats: { total, verified, ... } }. */
export const adminStatsRequest = () => api.get('/admin/stats').then((r) => r.data);

/**
 * Normalises an axios error into a user-friendly message, falling back when the
 * response is missing or its body is not the documented error shape.
 */
export function extractErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error?.message ?? fallback;
}