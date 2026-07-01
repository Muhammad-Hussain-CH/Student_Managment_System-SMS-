import { Router } from 'express';
import {
  createFeeStructure,
  getAllFeeStructures,
  getAllPayments,
  markAsPaid,
  updateOverduePayments,
  getMyFees,
} from '../controllers/fee.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

// Student
router.get('/me', authorize('student'), getMyFees);

// Admin
router.get('/structures', authorize('admin'), getAllFeeStructures);
router.post('/structures', authorize('admin'), createFeeStructure);
router.get('/payments', authorize('admin'), getAllPayments);
router.patch('/payments/:id/pay', authorize('admin'), markAsPaid);
router.patch('/payments/update-overdue', authorize('admin'), updateOverduePayments);

export default router;