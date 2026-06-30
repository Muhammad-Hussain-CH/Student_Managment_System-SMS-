import Attendance from '../models/Attendance.model.js';
import Student from '../models/Student.model.js';
import { ApiError, asyncHandler, sendSuccess } from '../utils/api.utils.js';

/**
 * POST /api/attendance/mark
 * Teacher/Admin — mark attendance for multiple students at once (a whole class)
 * Body: { subjectId, classId, date, records: [{ studentId, status, remarks }] }
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { subjectId, classId, date, records } = req.body;

  if (!subjectId || !classId || !date || !Array.isArray(records) || records.length === 0) {
    throw new ApiError('subjectId, classId, date, and records[] are required.', 400);
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];

  for (const record of records) {
    const { studentId, status, remarks } = record;
    if (!studentId || !status) continue;

    const doc = await Attendance.findOneAndUpdate(
      { student: studentId, subject: subjectId, date: attendanceDate },
      {
        student: studentId,
        subject: subjectId,
        class: classId,
        date: attendanceDate,
        status,
        remarks: remarks || '',
        markedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    results.push(doc);
  }

  sendSuccess(res, results, `Attendance marked for ${results.length} students.`);
});

/**
 * GET /api/attendance?subjectId=&classId=&date=
 * Teacher/Admin — get attendance for a specific subject + class + date
 */
export const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { subjectId, classId, date } = req.query;

  if (!subjectId || !classId || !date) {
    throw new ApiError('subjectId, classId, and date are required query params.', 400);
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const records = await Attendance.find({
    subject: subjectId,
    class: classId,
    date: attendanceDate,
  }).populate({
    path: 'student',
    populate: { path: 'user', select: 'name email avatar' },
    select: 'rollNo user',
  });

  sendSuccess(res, records);
});

/**
 * GET /api/attendance/student/:studentId/summary?subjectId=
 */
export const getStudentSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subjectId } = req.query;

  const filter = { student: studentId };
  if (subjectId) filter.subject = subjectId;

  const records = await Attendance.find(filter);

  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const leave = records.filter((r) => r.status === 'leave').length;

  const attendedCount = present + late;
  const percentage = total > 0 ? Math.round((attendedCount / total) * 10000) / 100 : 0;

  sendSuccess(res, {
    total,
    present,
    absent,
    late,
    leave,
    percentage,
    belowThreshold: percentage < 75 && total > 0,
  });
});

/**
 * GET /api/attendance/me/summary?subjectId=
 * Student — get own attendance summary
 */
export const getMySummary = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new ApiError('Student profile not found.', 404);

  const { subjectId } = req.query;
  const filter = { student: student._id };
  if (subjectId) filter.subject = subjectId;

  const records = await Attendance.find(filter).populate('subject', 'name code');

  const bySubject = {};
  for (const r of records) {
    const key = r.subject?._id?.toString() || 'unknown';
    if (!bySubject[key]) {
      bySubject[key] = {
        subject: r.subject,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
      };
    }
    bySubject[key].total++;
    bySubject[key][r.status]++;
  }

  const summary = Object.values(bySubject).map((s) => {
    const attended = s.present + s.late;
    const percentage = s.total > 0 ? Math.round((attended / s.total) * 10000) / 100 : 0;
    return { ...s, percentage, belowThreshold: percentage < 75 && s.total > 0 };
  });

  sendSuccess(res, summary);
});