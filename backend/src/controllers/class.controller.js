import Class from '../models/Class.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';

/**
 * POST /api/classes
 * Admin — create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const { name, section, program, semester } = req.body;

  const newClass = await Class.create({ name, section, program, semester });
  sendSuccess(res, newClass, 'Class created successfully.', 201);
});

/**
 * GET /api/classes
 * Admin/Teacher — list all classes
 */
export const getAllClasses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, program, isActive } = req.query;

  const filter = {};
  if (program) filter.program = { $regex: program, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const classes = await Class.find(filter)
    .populate({
      path: 'classTeacher',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ program: 1, semester: 1, section: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Class.countDocuments(filter);
  sendPaginated(res, classes, total, page, limit);
});

/**
 * GET /api/classes/:id
 */
export const getClass = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.id).populate({
    path: 'classTeacher',
    populate: { path: 'user', select: 'name email' },
  });

  if (!classDoc) throw new ApiError('Class not found.', 404);
  sendSuccess(res, classDoc);
});

/**
 * PATCH /api/classes/:id
 * Admin — update class details
 */
export const updateClass = asyncHandler(async (req, res) => {
  const { name, section, program, semester, classTeacher, isActive } = req.body;

  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new ApiError('Class not found.', 404);

  if (name) classDoc.name = name;
  if (section) classDoc.section = section;
  if (program) classDoc.program = program;
  if (semester) classDoc.semester = semester;
  if (classTeacher !== undefined) classDoc.classTeacher = classTeacher || null;
  if (isActive !== undefined) classDoc.isActive = isActive;

  await classDoc.save();
  sendSuccess(res, classDoc, 'Class updated successfully.');
});

/**
 * DELETE /api/classes/:id
 * Admin — soft delete
 */
export const deleteClass = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new ApiError('Class not found.', 404);

  classDoc.isActive = false;
  await classDoc.save();

  sendSuccess(res, null, 'Class deactivated successfully.');
});