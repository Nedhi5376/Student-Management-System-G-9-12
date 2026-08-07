import { forbidden } from '../utils/httpError.js';

export function requirePasswordChange(req, _res, next) {
  if (!req.user) return next();
  if (req.user.role === 'teacher' && !req.user.passwordChanged) {
    return next(forbidden('Password change required'));
  }
  return next();
}