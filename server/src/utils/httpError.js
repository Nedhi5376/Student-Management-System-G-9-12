export class HttpError extends Error {
  constructor(status, message, code = undefined, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') => new HttpError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'Insufficient permissions') => new HttpError(403, message, 'FORBIDDEN');
export const tooManyRequests = (message = 'Too many requests') => new HttpError(429, message, 'TOO_MANY_REQUESTS');
