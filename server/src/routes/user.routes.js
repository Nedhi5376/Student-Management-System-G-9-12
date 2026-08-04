import { Router } from 'express';
import { getMe, getStats, listUsers, updateUserRole } from '../controllers/user.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validateBody } from '../middlewares/validate.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { verifyRole } from '../middlewares/verifyRole.js';
import { updateRoleSchema } from '../utils/validators.js';

export const userRouter = Router();
userRouter.get('/me', verifyJWT, asyncHandler(getMe));

export const adminRouter = Router();
adminRouter.get('/stats', verifyJWT, verifyRole('admin'), asyncHandler(getStats));
adminRouter.get('/users', verifyJWT, verifyRole('admin'), asyncHandler(listUsers));
adminRouter.patch('/users/:id/role', verifyJWT, verifyRole('admin'), validateBody(updateRoleSchema), asyncHandler(updateUserRole));
