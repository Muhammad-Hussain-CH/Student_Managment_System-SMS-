import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAvailablePermissions,
} from '../controllers/role.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const roleValidation = [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('key').trim().notEmpty().withMessage('Role key is required')
    .matches(/^[a-z_]+$/).withMessage('Role key must be lowercase letters and underscores only'),
];

router.use(protect, authorize('admin'));

router.get('/permissions/list', getAvailablePermissions);
router.get('/', getAllRoles);
router.get('/:id', getRole);
router.post('/', roleValidation, validate, createRole);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;