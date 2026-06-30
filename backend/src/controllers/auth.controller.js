import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Teacher from '../models/Teacher.model.js';
import { sendTokenResponse, verifyToken, generateAccessToken } from '../utils/jwt.utils.js';
import { ApiError, asyncHandler, sendSuccess } from '../utils/api.utils.js';

/**
 * POST /api/auth/register
 * Admin only — register any user type
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, program, qualification, department } = req.body;

  // Check duplicate
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError('Email already in use.', 409);

  const user = await User.create({ name, email, password, role });

  // Create role-specific profile
  if (role === 'student') {
    const rollNo = await Student.generateRollNo(program || 'GEN');
    await Student.create({ user: user._id, rollNo, program: program || 'General' });
  } else if (role === 'teacher') {
    const employeeId = await Teacher.generateEmployeeId();
    await Teacher.create({ user: user._id, employeeId, qualification, department });
  }

  sendTokenResponse(user, 201, res);
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new ApiError('Your account is deactivated. Contact admin.', 403);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out successfully.');
});

/**
 * GET /api/auth/me
 * Returns current authenticated user + their profile
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  let profile = null;
  if (user.role === 'student') {
    profile = await Student.findOne({ user: user._id }).populate('class');
  } else if (user.role === 'teacher') {
    profile = await Teacher.findOne({ user: user._id }).populate('subjects');
  }

  sendSuccess(res, { user, profile });
});

/**
 * POST /api/auth/refresh
 * Exchange refresh token for new access token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError('No refresh token.', 401);

  try {
    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError('User not found.', 401);

    const accessToken = generateAccessToken(user._id);
    sendSuccess(res, { accessToken });
  } catch {
    throw new ApiError('Refresh token invalid or expired.', 401);
  }
});

/**
 * PATCH /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError('Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, null, 'Password changed successfully.');
});
