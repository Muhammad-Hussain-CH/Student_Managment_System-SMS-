import { Router } from 'express';
import {
  getDashboardStats,
  getAttendanceReport,
  getFeeReport,
  getResultsReport,
} from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/attendance-report', getAttendanceReport);
router.get('/fee-report', getFeeReport);
router.get('/results-report', getResultsReport);

export default router;