import FeeStructure from '../models/FeeStructure.model.js';
import FeePayment from '../models/FeePayment.model.js';
import Student from '../models/Student.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';

/**
 * POST /api/fees/structures
 * Admin — create a fee structure
 */
export const createFeeStructure = asyncHandler(async (req, res) => {
  const { name, amount, dueDate, finePerDay, assignedTo, classes, students } = req.body;

  const fee = await FeeStructure.create({
    name,
    amount,
    dueDate,
    finePerDay: finePerDay || 0,
    assignedTo: assignedTo || 'class',
    classes: classes || [],
    students: students || [],
  });

  // Auto-generate payment records for assigned students/classes
  let targetStudents = [];

  if (assignedTo === 'class' || assignedTo === 'both') {
    const classDocs = await Student.find({ class: { $in: classes || [] }, isActive: true });
    targetStudents = [...targetStudents, ...classDocs];
  }

  if (assignedTo === 'student' || assignedTo === 'both') {
    const studentDocs = await Student.find({ _id: { $in: students || [] }, isActive: true });
    targetStudents = [...targetStudents, ...studentDocs];
  }

  // Remove duplicates
  const uniqueStudents = [...new Map(targetStudents.map((s) => [s._id.toString(), s])).values()];

  for (const student of uniqueStudents) {
    await FeePayment.create({
      student: student._id,
      feeStructure: fee._id,
      amountDue: amount,
      fineAmount: 0,
      totalDue: amount,
      status: 'pending',
    });
  }

  sendSuccess(res, { fee, paymentsCreated: uniqueStudents.length }, 'Fee structure created successfully.', 201);
});

/**
 * GET /api/fees/structures
 * Admin — list all fee structures
 */
export const getAllFeeStructures = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const fees = await FeeStructure.find()
    .populate('classes', 'name section program')
    .populate({ path: 'students', populate: { path: 'user', select: 'name' } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await FeeStructure.countDocuments();
  sendPaginated(res, fees, total, page, limit);
});

/**
 * GET /api/fees/payments
 * Admin — list all payments with filters
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, studentId } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (studentId) filter.student = studentId;

  const payments = await FeePayment.find(filter)
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' }, select: 'rollNo user' })
    .populate('feeStructure', 'name amount dueDate finePerDay')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await FeePayment.countDocuments(filter);
  sendPaginated(res, payments, total, page, limit);
});

/**
 * PATCH /api/fees/payments/:id/pay
 * Admin — mark a payment as paid
 */
export const markAsPaid = asyncHandler(async (req, res) => {
  const { amountPaid, remarks } = req.body;

  const payment = await FeePayment.findById(req.params.id).populate('feeStructure');
  if (!payment) throw new ApiError('Payment record not found.', 404);

  // Calculate fine if overdue
  const now = new Date();
  const dueDate = new Date(payment.feeStructure.dueDate);
  let fineAmount = 0;

  if (now > dueDate && payment.feeStructure.finePerDay > 0) {
    const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    fineAmount = daysLate * payment.feeStructure.finePerDay;
  }

  payment.fineAmount = fineAmount;
  payment.totalDue = payment.amountDue + fineAmount;
  payment.amountPaid = amountPaid || payment.totalDue;
  payment.paidOn = new Date();
  payment.remarks = remarks || '';
  payment.status = payment.amountPaid >= payment.totalDue ? 'paid' : 'partial';

  await payment.save();
  sendSuccess(res, payment, 'Payment marked successfully.');
});

/**
 * PATCH /api/fees/payments/update-overdue
 * Admin — scan all pending payments and mark overdue ones
 */
export const updateOverduePayments = asyncHandler(async (req, res) => {
  const now = new Date();

  const pendingPayments = await FeePayment.find({ status: 'pending' }).populate('feeStructure');

  let updatedCount = 0;
  for (const payment of pendingPayments) {
    if (payment.feeStructure && new Date(payment.feeStructure.dueDate) < now) {
      const daysLate = Math.floor((now - new Date(payment.feeStructure.dueDate)) / (1000 * 60 * 60 * 24));
      payment.fineAmount = daysLate * (payment.feeStructure.finePerDay || 0);
      payment.totalDue = payment.amountDue + payment.fineAmount;
      payment.status = 'overdue';
      await payment.save();
      updatedCount++;
    }
  }

  sendSuccess(res, { updatedCount }, `${updatedCount} payments marked as overdue.`);
});

/**
 * GET /api/fees/me
 * Student — get own fee payments
 */
export const getMyFees = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new ApiError('Student profile not found.', 404);

  const payments = await FeePayment.find({ student: student._id })
    .populate('feeStructure', 'name amount dueDate finePerDay')
    .sort({ createdAt: -1 });

  // Update fines on the fly
  const now = new Date();
  const updated = payments.map((p) => {
    const fee = p.feeStructure ;
    if (p.status === 'pending' && fee && new Date(fee.dueDate) < now && fee.finePerDay > 0) {
      const daysLate = Math.floor((now.getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const fine = daysLate * fee.finePerDay;
      return { ...p.toObject(), fineAmount: fine, totalDue: p.amountDue + fine, status: 'overdue' };
    }
    return p.toObject();
  });

  sendSuccess(res, updated);
});