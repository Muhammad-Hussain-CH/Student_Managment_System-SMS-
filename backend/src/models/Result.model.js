import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks are required'],
      min: 0,
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate result for same student + exam
resultSchema.index({ student: 1, exam: 1 }, { unique: true });

// Auto-calculate percentage and grade before saving
resultSchema.pre('save', async function (next) {
  if (this.isModified('obtainedMarks')) {
    const exam = await mongoose.model('Exam').findById(this.exam);
    if (exam) {
      this.percentage = Math.round((this.obtainedMarks / exam.totalMarks) * 10000) / 100;
      if (this.percentage >= 90) this.grade = 'A';
      else if (this.percentage >= 80) this.grade = 'B';
      else if (this.percentage >= 70) this.grade = 'C';
      else if (this.percentage >= 60) this.grade = 'D';
      else this.grade = 'F';
    }
  }
  next();
});

const Result = mongoose.model('Result', resultSchema);
export default Result;