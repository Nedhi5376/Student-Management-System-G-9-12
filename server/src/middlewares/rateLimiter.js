import rateLimit from 'express-rate-limit';

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' } },
};

export const registerLimiter = rateLimit({ ...shared, windowMs: 60 * 60 * 1000, limit: 10 });
export const loginLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 10 });
export const mfaLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 10 });
export const refreshLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 60 });
export const apiLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 300 });
