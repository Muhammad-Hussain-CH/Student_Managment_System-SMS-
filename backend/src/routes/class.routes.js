import { Router } from 'express';
import { body } from 'express-validator';
import {
  createClass,
  getAllClasses,
  getClass,
  updateClass,
  deleteClass,
} from '../controllers/class.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const classValidation = [
  body('name').trim().notEmpty().withMessage('Class name is required'),
  body('section').trim().notEmpty().withMessage('Section is required'),
  body('program').trim().notEmpty().withMessage('Program is required'),
];

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getAllClasses);
router.get('/:id', authorize('admin', 'teacher'), getClass);
router.post('/', authorize('admin'), classValidation, validate, createClass);
router.patch('/:id', authorize('admin'), updateClass);
router.delete('/:id', authorize('admin'), deleteClass);

export default router;