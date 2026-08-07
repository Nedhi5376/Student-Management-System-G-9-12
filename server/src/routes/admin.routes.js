import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getStats,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/admin.controller.js';
import {
  createClass,
  deleteClass,
  getClass,
  listClasses,
  listClassStudents,
  updateClass,
} from '../controllers/class.controller.js';
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from '../controllers/subject.controller.js';
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
} from '../controllers/assignment.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validateBody } from '../middlewares/validate.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { verifyRole } from '../middlewares/verifyRole.js';
import {
  assignmentSchema,
  classSchema,
  subjectSchema,
  updateClassSchema,
  updateSubjectSchema,
  updateUserSchema,
} from '../utils/validators.js';

export const adminRouter = Router();
adminRouter.use(verifyJWT, verifyRole('admin'));

// Accounts
adminRouter.get('/stats', asyncHandler(getStats));
adminRouter.get('/users', asyncHandler(listUsers));
adminRouter.post('/users', asyncHandler(createUser));
adminRouter.get('/users/:id', asyncHandler(getUser));
adminRouter.patch('/users/:id', validateBody(updateUserSchema), asyncHandler(updateUser));
adminRouter.delete('/users/:id', asyncHandler(deleteUser));

// Classes
adminRouter.get('/classes', asyncHandler(listClasses));
adminRouter.post('/classes', validateBody(classSchema), asyncHandler(createClass));
adminRouter.get('/classes/:id', asyncHandler(getClass));
adminRouter.get('/classes/:id/students', asyncHandler(listClassStudents));
adminRouter.patch('/classes/:id', validateBody(updateClassSchema), asyncHandler(updateClass));
adminRouter.delete('/classes/:id', asyncHandler(deleteClass));

// Subjects
adminRouter.get('/subjects', asyncHandler(listSubjects));
adminRouter.post('/subjects', validateBody(subjectSchema), asyncHandler(createSubject));
adminRouter.patch('/subjects/:id', validateBody(updateSubjectSchema), asyncHandler(updateSubject));
adminRouter.delete('/subjects/:id', asyncHandler(deleteSubject));

// Assignments
adminRouter.get('/assignments', asyncHandler(listAssignments));
adminRouter.post('/assignments', validateBody(assignmentSchema), asyncHandler(createAssignment));
adminRouter.delete('/assignments/:id', asyncHandler(deleteAssignment));
