import { Router } from 'express';
import { getMe, listUsers } from '../controllers/user.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { verifyRole } from '../middlewares/verifyRole.js';

export const userRouter = Router();
userRouter.get('/me', verifyJWT, asyncHandler(getMe));

export const adminRouter = Router();
adminRouter.get('/users', verifyJWT, verifyRole('admin'), asyncHandler(listUsers));
