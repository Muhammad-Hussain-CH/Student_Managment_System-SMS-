import Subject from '../models/Subject.model.js';
import Teacher from '../models/Teacher.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';

/**
 * POST /api/subjects
 * Admin — create a new subject
 */
export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, creditHours, classes } = req.body;

  const existing = await Subject.findOne({ code: code.toUpperCase() });
  if (existing) throw new ApiError(`Subject code '${code}' already exists.`, 409);

  const subject = await Subject.create({ name, code, creditHours, classes: classes || [] });
  sendSuccess(res, subject, 'Subject created successfully.', 201);
});

/**
 * GET /api/subjects
 * Admin/Teacher — list all subjects
 */
export const getAllSubjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, classId, isActive } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }
  if (classId) filter.classes = classId;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const subjects = await Subject.find(filter)
    .populate('classes', 'name section program')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
    .sort({ code: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Subject.countDocuments(filter);
  sendPaginated(res, subjects, total, page, limit);
});

/**
 * GET /api/subjects/:id
 */
export const getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('classes', 'name section program')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } });

  if (!subject) throw new ApiError('Subject not found.', 404);
  sendSuccess(res, subject);
});

/**
 * PATCH /api/subjects/:id
 * Admin — update subject details (name, code, credit hours, classes)
 */
export const updateSubject = asyncHandler(async (req, res) => {
  const { name, code, creditHours, classes, isActive } = req.body;

  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError('Subject not found.', 404);

  if (code && code.toUpperCase() !== subject.code) {
    const dup = await Subject.findOne({ code: code.toUpperCase() });
    if (dup) throw new ApiError(`Subject code '${code}' already exists.`, 409);
    subject.code = code;
  }

  if (name) subject.name = name;
  if (creditHours) subject.creditHours = creditHours;
  if (classes) subject.classes = classes;
  if (isActive !== undefined) subject.isActive = isActive;

  await subject.save();
  sendSuccess(res, subject, 'Subject updated successfully.');
});

/**
 * PATCH /api/subjects/:id/assign-teacher
 * Admin — assign or unassign a teacher to this subject
 */
export const assignTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.body;

  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError('Subject not found.', 404);

  // Unassign
  if (!teacherId) {
    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subject._id } });
    }
    subject.teacher = null;
    await subject.save();
    return sendSuccess(res, subject, 'Teacher unassigned from subject.');
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new ApiError('Teacher not found.', 404);

  if (subject.teacher && subject.teacher.toString() !== teacherId) {
    await Teacher.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subject._id } });
  }

  subject.teacher = teacherId;
  await subject.save();

  await Teacher.findByIdAndUpdate(teacherId, { $addToSet: { subjects: subject._id } });

  const updated = await Subject.findById(subject._id).populate({
    path: 'teacher',
    populate: { path: 'user', select: 'name email' },
  });

  sendSuccess(res, updated, 'Teacher assigned to subject successfully.');
});

/**
 * DELETE /api/subjects/:id
 * Admin — soft delete
 */
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError('Subject not found.', 404);

  subject.isActive = false;
  await subject.save();

  sendSuccess(res, null, 'Subject deactivated successfully.');
});