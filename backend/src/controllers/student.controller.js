import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';
import cloudinary from '../config/cloudinary.js';

/**
 * GET /api/students
 * Admin/Teacher — list all students with pagination, search, filters
 */
export const getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, program, classId, isActive } = req.query;

  const filter = {};
  if (program) filter.program = { $regex: program, $options: 'i' };
  if (classId) filter.class = classId;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Join User for search on name/email
  const students = await Student.find(filter)
    .populate({
      path: 'user',
      match: search
        ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
        : {},
      select: 'name email avatar isActive',
    })
    .populate('class', 'name section')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  // Filter out nulled populated users (search miss)
  const filtered = students.filter((s) => s.user !== null);
  const total = await Student.countDocuments(filter);

  sendPaginated(res, filtered, total, page, limit);
});

/**
 * GET /api/students/:id
 */
export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', 'name email avatar role lastLogin')
    .populate('class', 'name section program');

  if (!student) throw new ApiError('Student not found.', 404);

  // Students can only view themselves
  if (req.user.role === 'student') {
    const myProfile = await Student.findOne({ user: req.user._id });
    if (!myProfile || myProfile._id.toString() !== student._id.toString()) {
      throw new ApiError('Access denied.', 403);
    }
  }

  sendSuccess(res, student);
});

/**
 * PATCH /api/students/:id
 * Admin — update student profile
 */
export const updateStudent = asyncHandler(async (req, res) => {
  const { program, dob, gender, cnic, contact, guardian, batch, classId, isActive } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError('Student not found.', 404);

  if (program) student.program = program;
  if (dob) student.dob = dob;
  if (gender) student.gender = gender;
  if (cnic) student.cnic = cnic;
  if (contact) student.contact = { ...student.contact, ...contact };
  if (guardian) student.guardian = { ...student.guardian, ...guardian };
  if (batch) student.batch = batch;
  if (classId) student.class = classId;
  if (isActive !== undefined) student.isActive = isActive;

  await student.save();

  // Also update user name if provided
  if (req.body.name || req.body.email) {
    await User.findByIdAndUpdate(student.user, {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.email && { email: req.body.email }),
    });
  }

  const updated = await Student.findById(student._id).populate('user', 'name email avatar');
  sendSuccess(res, updated, 'Student updated successfully.');
});

/**
 * DELETE /api/students/:id
 * Admin only — soft delete (deactivate)
 */
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError('Student not found.', 404);

  // Soft delete
  student.isActive = false;
  await student.save();
  await User.findByIdAndUpdate(student.user, { isActive: false });

  sendSuccess(res, null, 'Student deactivated successfully.');
});

/**
 * POST /api/students/:id/photo
 * Upload student photo to Cloudinary
 */
export const uploadStudentPhoto = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError('Student not found.', 404);

  if (!req.file) throw new ApiError('No file uploaded.', 400);

  // Delete old photo if exists
  if (student.photo?.public_id) {
    await cloudinary.uploader.destroy(student.photo.public_id);
  }

  // File was uploaded to cloudinary via multer middleware
  student.photo = {
    public_id: req.file.filename,
    url: req.file.path,
  };
  await student.save();

  sendSuccess(res, { photo: student.photo }, 'Photo uploaded successfully.');
});

/**
 * GET /api/students/me
 * Student role — get own profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'name email avatar lastLogin')
    .populate('class', 'name section');

  if (!student) throw new ApiError('Student profile not found.', 404);

  sendSuccess(res, student);
});
