import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      required: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    contact: {
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

teacherSchema.statics.generateEmployeeId = async function () {
  const count = await this.countDocuments();
  return `TCH-${String(count + 1).padStart(4, '0')}`;
};

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
