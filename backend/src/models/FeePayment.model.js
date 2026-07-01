import mongoose from 'mongoose';

const feePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: true,
    },
    amountDue: {
      type: Number,
      required: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    totalDue: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partial'],
      default: 'pending',
    },
    paidOn: {
      type: Date,
      default: null,
    },
    challanNo: {
      type: String,
      unique: true,
      sparse: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate payment record for same student + fee structure
feePaymentSchema.index({ student: 1, feeStructure: 1 }, { unique: true });

// Auto-generate challan number
feePaymentSchema.pre('save', async function (next) {
  if (!this.challanNo) {
    const count = await mongoose.model('FeePayment').countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    this.challanNo = `CHN-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);
export default FeePayment;