import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/token.service.js';
import { unauthorized } from '../utils/httpError.js';

export async function verifyJWTQuery(req, _res, next) {
  const token = req.query.token;
  if (typeof token !== 'string' || token.length === 0) return next(unauthorized());

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return next(unauthorized());
    req.user = user;
    return next();
  } catch {
    return next(unauthorized('Access token is invalid or expired'));
  }
}