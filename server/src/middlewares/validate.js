import { badRequest } from '../utils/httpError.js';

/**
 * Replaces req.body with the parsed result, so downstream code can only see
 * whitelisted, coerced values (blocks NoSQL operator injection such as
 * { email: { $ne: null } }).
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(badRequest('Validation failed', fieldErrors));
    }
    req.body = result.data;
    return next();
  };
}
