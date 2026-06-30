import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'], // e.g. "BSSE 5th Semester"
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'], // e.g. "A", "B"
      trim: true,
      uppercase: true,
    },
    program: {
      type: String,
      required: [true, 'Program is required'], // e.g. "BSSE", "BSCS"
      trim: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classSchema.index({ program: 1, section: 1, semester: 1 }, { unique: true });

const Class = mongoose.model('Class', classSchema);
export default Class;