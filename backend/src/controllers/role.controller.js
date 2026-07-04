import Role from '../models/Role.model.js';
import User from '../models/User.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';

/**
 * GET /api/roles
 * Admin — list all roles
 */
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ createdAt: 1 });
  sendSuccess(res, roles);
});

/**
 * GET /api/roles/:id
 */
export const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError('Role not found.', 404);
  sendSuccess(res, role);
});

/**
 * POST /api/roles
 * Admin — create a custom role
 */
export const createRole = asyncHandler(async (req, res) => {
  const { name, key, permissions, homeRoute } = req.body;

  const existing = await Role.findOne({ key: key.toLowerCase() });
  if (existing) throw new ApiError(`Role key '${key}' already exists.`, 409);

  const role = await Role.create({
    name,
    key: key.toLowerCase(),
    permissions: permissions || [],
    homeRoute: homeRoute || '/dashboard',
  });

  sendSuccess(res, role, 'Role created successfully.', 201);
});

/**
 * PATCH /api/roles/:id
 * Admin — update a role
 */
export const updateRole = asyncHandler(async (req, res) => {
  const { name, permissions, homeRoute, isActive } = req.body;

  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError('Role not found.', 404);

  // Protect core roles from being modified
  if (['admin', 'teacher', 'student'].includes(role.key) && req.body.key) {
    throw new ApiError('Cannot change the key of a core role.', 400);
  }

  if (name) role.name = name;
  if (permissions) role.permissions = permissions;
  if (homeRoute) role.homeRoute = homeRoute;
  if (isActive !== undefined) role.isActive = isActive;

  await role.save();
  sendSuccess(res, role, 'Role updated successfully.');
});

/**
 * DELETE /api/roles/:id
 * Admin — delete a custom role (only if no users assigned)
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError('Role not found.', 404);

  // Protect core roles
  if (['admin', 'teacher', 'student'].includes(role.key)) {
    throw new ApiError('Cannot delete core system roles.', 400);
  }

  // Check if any users have this role
  const usersWithRole = await User.countDocuments({ role: role._id });
  if (usersWithRole > 0) {
    throw new ApiError(
      `Cannot delete role — ${usersWithRole} user(s) are assigned to it. Reassign them first.`,
      400
    );
  }

  await role.deleteOne();
  sendSuccess(res, null, 'Role deleted successfully.');
});

/**
 * GET /api/roles/permissions/list
 * Admin — list all available permissions
 */
export const getAvailablePermissions = asyncHandler(async (req, res) => {
  const permissions = [
    { key: '*', label: 'All Permissions (Super Admin)' },
    { key: 'can_view_students', label: 'View Students' },
    { key: 'can_mark_attendance', label: 'Mark Attendance' },
    { key: 'can_view_attendance', label: 'View Attendance' },
    { key: 'can_create_exams', label: 'Create Exams' },
    { key: 'can_enter_results', label: 'Enter Results' },
    { key: 'can_view_own_profile', label: 'View Own Profile' },
    { key: 'can_view_own_attendance', label: 'View Own Attendance' },
    { key: 'can_view_own_results', label: 'View Own Results' },
    { key: 'can_view_own_fees', label: 'View Own Fees' },
    { key: 'can_manage_fees', label: 'Manage Fees' },
    { key: 'can_view_reports', label: 'View Reports' },
    { key: 'can_manage_classes', label: 'Manage Classes' },
    { key: 'can_manage_subjects', label: 'Manage Subjects' },
  ];

  sendSuccess(res, permissions);
});