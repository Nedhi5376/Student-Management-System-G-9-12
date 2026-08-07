import { Router } from 'express';
import { getMe } from '../controllers/user.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';

export const userRouter = Router();
userRouter.get('/me', verifyJWT, asyncHandler(getMe));
