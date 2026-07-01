import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fee name is required'], // e.g. "Tuition Fee", "Lab Fee"
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    finePerDay: {
      type: Number,
      default: 0, // fine amount per day after due date
      min: 0,
    },
    assignedTo: {
      type: String,
      enum: ['class', 'student', 'both'],
      default: 'class',
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;