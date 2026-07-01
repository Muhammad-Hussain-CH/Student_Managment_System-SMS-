import { Router } from 'express';
import { body } from 'express-validator';
import {
  createExam,
  getAllExams,
  getExam,
  enterResults,
  getExamResults,
  getStudentResults,
  getMyResults,
} from '../controllers/exam.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const examValidation = [
  body('name').trim().notEmpty().withMessage('Exam name is required'),
  body('type').isIn(['midterm', 'final']).withMessage('Type must be midterm or final'),
  body('subjectId').notEmpty().withMessage('Subject is required'),
  body('classId').notEmpty().withMessage('Class is required'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('date').isISO8601().withMessage('Valid date is required'),
];

router.use(protect);

// Student
router.get('/me/results', authorize('student'), getMyResults);

// Admin/Teacher
router.get('/', authorize('admin', 'teacher'), getAllExams);
router.get('/:id', authorize('admin', 'teacher'), getExam);
router.get('/:id/results', authorize('admin', 'teacher'), getExamResults);
router.get('/student/:studentId', authorize('admin', 'teacher'), getStudentResults);
router.post('/', authorize('admin', 'teacher'), examValidation, validate, createExam);
router.post('/:id/results', authorize('admin', 'teacher'), enterResults);

export default router;