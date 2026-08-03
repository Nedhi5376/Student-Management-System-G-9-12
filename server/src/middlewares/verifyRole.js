import { forbidden, unauthorized } from '../utils/httpError.js';

/** Role is always re-read from the database record, never from client input. */
export function verifyRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!allowedRoles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}
