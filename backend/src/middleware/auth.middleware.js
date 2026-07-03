import { verifyToken } from '../utils/jwt.utils.js';
import { ApiError, asyncHandler } from '../utils/api.utils.js';
import User from '../models/User.model.js';

/**
 * Protect routes - verify JWT from Authorization header
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError('Access denied. No token provided.', 401);
  }

  try {
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('role');

    if (!user) {
      throw new ApiError('User not found. Token is invalid.', 401);
    }

    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated. Contact admin.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Token is invalid or expired. Please log in again.', 401);
  }
});

/**
 * Authorize specific role keys (for backward compatibility)
 * Usage: authorize('admin', 'teacher')
 */
export const authorize = (...roleKeys) => {
  return (req, res, next) => {
    const userRoleKey = req.user.role?.key;
    if (!roleKeys.includes(userRoleKey)) {
      throw new ApiError(
        `Access denied. Role '${userRoleKey}' is not authorized for this action.`,
        403
      );
    }
    next();
  };
};

/**
 * Authorize by permission
 * Usage: authorizeByPermission('can_mark_attendance')
 */
export const authorizeByPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.role?.permissions || [];
    const hasPermission = userPermissions.includes('*') || userPermissions.includes(permission);
    
    if (!hasPermission) {
      throw new ApiError(
        `Access denied. Permission '${permission}' not granted.`,
        403
      );
    }
    next();
  };
};
