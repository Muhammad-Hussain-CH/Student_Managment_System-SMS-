import { Router } from 'express';
import {
  markAttendance,
  getAttendanceByDate,
  getStudentSummary,
  getMySummary,
} from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

// Student self-access
router.get('/me/summary', authorize('student'), getMySummary);

// Teacher/Admin
router.post('/mark', authorize('admin', 'teacher'), markAttendance);
router.get('/', authorize('admin', 'teacher'), getAttendanceByDate);
router.get('/student/:studentId/summary', authorize('admin', 'teacher', 'student'), getStudentSummary);

export default router;