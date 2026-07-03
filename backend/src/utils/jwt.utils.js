import jwt from 'jsonwebtoken';

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (userId, roleKey = null, permissions = []) => {
  return jwt.sign(
    { id: userId, roleKey, permissions },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

/**
 * Verify any token
 */
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

/**
 * Set token in HTTP-only cookie
 */
export const sendTokenResponse = (user, statusCode, res) => {
  // Prepare role info (user.role may be ObjectId or populated object)
  const role = typeof user.role === 'object' && user.role !== null ? user.role : { _id: user.role };
  const roleKey = role?.key || 'unknown';
  const permissions = role?.permissions || [];

  const accessToken = generateAccessToken(user._id, roleKey, permissions);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .status(statusCode)
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
    .json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: {
          _id: role._id,
          key: role.key,
          name: role.name,
          permissions: role.permissions,
          homeRoute: role.homeRoute,
        },
        avatar: user.avatar,
      },
    });
};
