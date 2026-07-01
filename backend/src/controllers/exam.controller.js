import Exam from '../models/Exam.model.js';
import Result from '../models/Result.model.js';
import Student from '../models/Student.model.js';
import { ApiError, asyncHandler, sendSuccess, sendPaginated } from '../utils/api.utils.js';

/**
 * POST /api/exams
 * Admin/Teacher — create an exam
 */
export const createExam = asyncHandler(async (req, res) => {
  const { name, type, subjectId, classId, totalMarks, date } = req.body;

  const exam = await Exam.create({
    name,
    type,
    subject: subjectId,
    class: classId,
    totalMarks,
    date,
    createdBy: req.user._id,
  });

  sendSuccess(res, exam, 'Exam created successfully.', 201);
});

/**
 * GET /api/exams
 * Admin/Teacher — list all exams
 */
export const getAllExams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, classId, subjectId, type } = req.query;

  const filter = {};
  if (classId) filter.class = classId;
  if (subjectId) filter.subject = subjectId;
  if (type) filter.type = type;

  const exams = await Exam.find(filter)
    .populate('subject', 'name code')
    .populate('class', 'name section program')
    .populate('createdBy', 'name')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Exam.countDocuments(filter);
  sendPaginated(res, exams, total, page, limit);
});

/**
 * GET /api/exams/:id
 */
export const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('class', 'name section program');

  if (!exam) throw new ApiError('Exam not found.', 404);
  sendSuccess(res, exam);
});

/**
 * POST /api/exams/:id/results
 * Admin/Teacher — enter results for multiple students at once
 * Body: { results: [{ studentId, obtainedMarks, remarks }] }
 */
export const enterResults = asyncHandler(async (req, res) => {
  const { results } = req.body;
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError('Exam not found.', 404);

  if (!Array.isArray(results) || results.length === 0) {
    throw new ApiError('results[] array is required.', 400);
  }

  const saved = [];

  for (const r of results) {
    const { studentId, obtainedMarks, remarks } = r;
    if (obtainedMarks > exam.totalMarks) continue;

    // Calculate percentage and grade here directly
    const percentage = Math.round((obtainedMarks / exam.totalMarks) * 10000) / 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    const doc = await Result.findOneAndUpdate(
      { student: studentId, exam: exam._id },
      {
        student: studentId,
        exam: exam._id,
        obtainedMarks,
        percentage,
        grade,
        remarks: remarks || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    saved.push(doc);
  }

  sendSuccess(res, saved, `Results entered for ${saved.length} students.`);
});

/**
 * GET /api/exams/:id/results
 * Admin/Teacher — get all results for an exam
 */
export const getExamResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('class', 'name section');

  if (!exam) throw new ApiError('Exam not found.', 404);

  const results = await Result.find({ exam: exam._id })
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
      select: 'rollNo user',
    })
    .sort({ grade: 1 });

  sendSuccess(res, { exam, results });
});

/**
 * GET /api/exams/student/:studentId
 * Get all results for a student
 */
export const getStudentResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.params.studentId })
    .populate({
      path: 'exam',
      populate: [
        { path: 'subject', select: 'name code' },
        { path: 'class', select: 'name section' },
      ],
    })
    .sort({ createdAt: -1 });

  sendSuccess(res, results);
});

/**
 * GET /api/exams/me/results
 * Student — get own results
 */
export const getMyResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new ApiError('Student profile not found.', 404);

  const results = await Result.find({ student: student._id })
    .populate({
      path: 'exam',
      populate: [
        { path: 'subject', select: 'name code' },
        { path: 'class', select: 'name section' },
      ],
    })
    .sort({ createdAt: -1 });

  sendSuccess(res, results);
});