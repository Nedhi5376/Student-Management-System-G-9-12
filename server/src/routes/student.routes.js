import { Router } from 'express';
import { getAcademicHistory, getAttendance, getGrades, getOverview, getTranscript } from '../controllers/student.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { verifyRole } from '../middlewares/verifyRole.js';

export const studentRouter = Router();
studentRouter.use(verifyJWT, verifyRole('student'));

studentRouter.get('/overview', asyncHandler(getOverview));
studentRouter.get('/grades', asyncHandler(getGrades));
studentRouter.get('/attendance', asyncHandler(getAttendance));
studentRouter.get('/academic-history', asyncHandler(getAcademicHistory));
studentRouter.get('/transcript', asyncHandler(getTranscript));
