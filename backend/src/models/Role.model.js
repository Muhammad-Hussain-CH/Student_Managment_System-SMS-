import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [100, 'Role name cannot exceed 100 characters'],
    },
    key: {
      type: String,
      required: [true, 'Role key is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [50, 'Role key cannot exceed 50 characters'],
    },
    permissions: {
      type: [String],
      default: [],
    },
    homeRoute: {
      type: String,
      default: '/dashboard',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;