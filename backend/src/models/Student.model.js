import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNo: {
      type: String,
      unique: true,
      required: true,
    },
    program: {
      type: String,
      required: [true, 'Program is required'],
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    cnic: {
      type: String,
      trim: true,
    },
    contact: {
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
    },
    guardian: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    photo: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    batch: {
      type: String, // e.g., "Fall 2024"
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate roll number
studentSchema.statics.generateRollNo = async function (program) {
  const prefix = program.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await this.countDocuments();
  const padded = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
