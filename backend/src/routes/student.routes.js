import { Router } from 'express';
import {
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  uploadStudentPhoto,
  getMyProfile,
} from '../controllers/student.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();



router.use(protect);

// Student self-access
router.get('/me', authorize('student'), getMyProfile);

// Admin / Teacher
router.get('/', authorize('admin', 'teacher'), getAllStudents);
router.get('/:id', authorize('admin', 'teacher', 'student'), getStudent);
router.patch('/:id', authorize('admin'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);


export default router;
