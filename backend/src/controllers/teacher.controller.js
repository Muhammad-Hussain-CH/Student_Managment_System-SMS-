import Teacher from '../models/Teacher.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';

/**
 * GET /api/teachers
 * Admin — list all teachers
 */
export const getAllTeachers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, department, isActive } = req.query;

  const filter = {};
  if (department) filter.department = { $regex: department, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const teachers = await Teacher.find(filter)
    .populate({
      path: 'user',
      match: search
        ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
        : {},
      select: 'name email avatar isActive',
    })
    .populate('subjects', 'name code')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const filtered = teachers.filter((t) => t.user !== null);
  const total = await Teacher.countDocuments(filter);

  sendPaginated(res, filtered, total, page, limit);
});

/**
 * GET /api/teachers/:id
 */
export const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('user', 'name email avatar lastLogin')
    .populate('subjects', 'name code creditHours');

  if (!teacher) throw new ApiError('Teacher not found.', 404);
  sendSuccess(res, teacher);
});

/**
 * GET /api/teachers/me
 * Teacher — get own profile
 */
export const getMyTeacherProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id })
    .populate('user', 'name email avatar')
    .populate('subjects', 'name code creditHours');

  if (!teacher) throw new ApiError('Teacher profile not found.', 404);
  sendSuccess(res, teacher);
});