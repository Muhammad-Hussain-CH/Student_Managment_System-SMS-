import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  assignTeacher,
  deleteSubject,
} from '../controllers/subject.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const subjectValidation = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
  body('creditHours')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credit hours must be between 1 and 6'),
];

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getAllSubjects);
router.get('/:id', authorize('admin', 'teacher'), getSubject);
router.post('/', authorize('admin'), subjectValidation, validate, createSubject);
router.patch('/:id', authorize('admin'), updateSubject);
router.patch('/:id/assign-teacher', authorize('admin'), assignTeacher);
router.delete('/:id', authorize('admin'), deleteSubject);

export default router;