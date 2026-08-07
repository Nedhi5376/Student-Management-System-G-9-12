import { Router } from 'express';
import {
  getMyAssignments,
  getRoster,
  listAttendance,
  listMarks,
  saveAttendance,
  saveMarks,
} from '../controllers/teacher.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validateBody } from '../middlewares/validate.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { verifyRole } from '../middlewares/verifyRole.js';
import { requirePasswordChange } from '../middlewares/requirePasswordChange.js';
import { attendanceSchema, marksSchema } from '../utils/validators.js';

export const teacherRouter = Router();
teacherRouter.use(verifyJWT, verifyRole('teacher'), requirePasswordChange);

teacherRouter.get('/assignments', asyncHandler(getMyAssignments));
teacherRouter.get('/assignments/:id/roster', asyncHandler(getRoster));

teacherRouter.post('/marks', validateBody(marksSchema), asyncHandler(saveMarks));
teacherRouter.get('/marks', asyncHandler(listMarks));

teacherRouter.post('/attendance', validateBody(attendanceSchema), asyncHandler(saveAttendance));
teacherRouter.get('/attendance', asyncHandler(listAttendance));
