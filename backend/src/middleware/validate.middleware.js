import { validationResult } from 'express-validator';
import { ApiError } from '../utils/api.utils.js';

/**
 * Run after express-validator chains — throws if any validation fails
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    throw new ApiError(messages.join('. '), 400);
  }
  next();
};
