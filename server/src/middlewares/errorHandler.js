import mongoose from 'mongoose';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid identifier provided' } });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
  }

  logger.error('unhandled error', { message: err.message, path: req.originalUrl });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
