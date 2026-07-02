import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Teacher from '../models/Teacher.model.js';
import Attendance from '../models/Attendance.model.js';
import FeePayment from '../models/FeePayment.model.js';
import Result from '../models/Result.model.js';
import { asyncHandler, sendSuccess } from '../utils/api.utils.js';

/**
 * GET /api/dashboard/stats
 * Admin — overall system stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalAttendance,
    presentAttendance,
    totalFeeCollected,
    totalFeePending,
    recentStudents,
  ] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments({ isActive: true }),
    Attendance.countDocuments(),
    Attendance.countDocuments({ status: { $in: ['present', 'late'] } }),
    FeePayment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    FeePayment.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$totalDue' } } },
    ]),
    Student.find({ isActive: true })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const attendanceRate = totalAttendance > 0
    ? Math.round((presentAttendance / totalAttendance) * 10000) / 100
    : 0;

  sendSuccess(res, {
    totalStudents,
    totalTeachers,
    attendanceRate,
    feeCollected: totalFeeCollected[0]?.total || 0,
    feePending: totalFeePending[0]?.total || 0,
    recentStudents,
  });
});

/**
 * GET /api/dashboard/attendance-report?classId=&startDate=&endDate=
 * Admin — attendance report for a class over a date range
 */
export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { classId, startDate, endDate } = req.query;

  const filter = {};
  if (classId) filter.class = classId;
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const records = await Attendance.find(filter)
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name' },
      select: 'rollNo user',
    })
    .populate('subject', 'name code')
    .sort({ date: -1 })
    .limit(500);

  // Summary by student
  const byStudent = {};
  for (const r of records) {
    const key = r.student?._id?.toString();
    if (!key) continue;
    if (!byStudent[key]) {
      byStudent[key] = {
        student: r.student,
        total: 0, present: 0, absent: 0, late: 0, leave: 0,
      };
    }
    byStudent[key].total++;
    byStudent[key][r.status]++;
  }

  const summary = Object.values(byStudent).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 10000) / 100 : 0,
  }));

  sendSuccess(res, { records: records.length, summary });
});

/**
 * GET /api/dashboard/fee-report
 * Admin — fee collection summary
 */
export const getFeeReport = asyncHandler(async (req, res) => {
  const [paid, pending, overdue, partial] = await Promise.all([
    FeePayment.countDocuments({ status: 'paid' }),
    FeePayment.countDocuments({ status: 'pending' }),
    FeePayment.countDocuments({ status: 'overdue' }),
    FeePayment.countDocuments({ status: 'partial' }),
  ]);

  const [collectedAgg, pendingAgg] = await Promise.all([
    FeePayment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
    FeePayment.aggregate([{ $match: { status: { $in: ['pending', 'overdue'] } } }, { $group: { _id: null, total: { $sum: '$totalDue' } } }]),
  ]);

  sendSuccess(res, {
    counts: { paid, pending, overdue, partial },
    collected: collectedAgg[0]?.total || 0,
    pending: pendingAgg[0]?.total || 0,
  });
});

/**
 * GET /api/dashboard/results-report?classId=
 * Admin — result summary per class
 */
export const getResultsReport = asyncHandler(async (req, res) => {
  const { classId } = req.query;

  const filter = {};
  if (classId) {
    const students = await Student.find({ class: classId }).select('_id');
    filter.student = { $in: students.map((s) => s._id) };
  }

  const results = await Result.find(filter).populate({
    path: 'exam',
    populate: { path: 'subject', select: 'name code' },
  });
const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
for (const r of results) {
  if (r.grade && gradeCounts[r.grade] !== undefined) {
    gradeCounts[r.grade]++;
  }
}

  const avgPercentage = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length * 100) / 100
    : 0;

  sendSuccess(res, { total: results.length, gradeCounts, avgPercentage });
});