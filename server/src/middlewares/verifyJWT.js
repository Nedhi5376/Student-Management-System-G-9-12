import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/token.service.js';
import { unauthorized } from '../utils/httpError.js';

export async function verifyJWT(req, _res, next) {
  const header = req.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return next(unauthorized());

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    const user = await User.findById(payload.sub);
    if (!user) return next(unauthorized());
    req.user = user;
    return next();
  } catch {
    return next(unauthorized('Access token is invalid or expired'));
  }
}
