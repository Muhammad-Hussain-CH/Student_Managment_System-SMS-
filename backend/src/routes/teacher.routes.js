import { Router } from 'express';
import { getAllTeachers, getTeacher, getMyTeacherProfile } from '../controllers/teacher.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/me', authorize('teacher'), getMyTeacherProfile);
router.get('/', authorize('admin'), getAllTeachers);
router.get('/:id', authorize('admin'), getTeacher);

export default router;