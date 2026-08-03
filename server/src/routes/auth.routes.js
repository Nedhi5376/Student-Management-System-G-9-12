import { Router } from 'express';
import {
  login,
  logout,
  logoutAll,
  refresh,
  register,
  verifyEmail,
  verifyMfaLogin,
} from '../controllers/auth.controller.js';
import {
  disableMfa,
  enableMfa,
  regenerateBackupCodes,
  setupMfa,
} from '../controllers/mfa.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validateBody } from '../middlewares/validate.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { loginLimiter, mfaLimiter, refreshLimiter, registerLimiter } from '../middlewares/rateLimiter.js';
import {
  loginSchema,
  mfaDisableSchema,
  mfaEnableSchema,
  registerSchema,
  totpSchema,
} from '../utils/validators.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validateBody(registerSchema), asyncHandler(register));
authRouter.get('/verify-email', asyncHandler(verifyEmail));
authRouter.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(login));
authRouter.post('/mfa/verify', mfaLimiter, validateBody(totpSchema), asyncHandler(verifyMfaLogin));
authRouter.post('/refresh', refreshLimiter, asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));

authRouter.post('/mfa/setup', verifyJWT, asyncHandler(setupMfa));
authRouter.post('/mfa/enable', verifyJWT, mfaLimiter, validateBody(mfaEnableSchema), asyncHandler(enableMfa));
authRouter.post('/mfa/disable', verifyJWT, mfaLimiter, validateBody(mfaDisableSchema), asyncHandler(disableMfa));
authRouter.post('/mfa/backup-codes', verifyJWT, asyncHandler(regenerateBackupCodes));
authRouter.post('/logout-all', verifyJWT, asyncHandler(logoutAll));
