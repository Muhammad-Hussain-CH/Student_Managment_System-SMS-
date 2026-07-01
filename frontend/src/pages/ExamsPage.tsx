import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import type { ClassItem, SubjectItem, StudentProfile, PaginatedResponse } from '@/types';

interface Exam {
  _id: string;
  name: string;
  type: 'midterm' | 'final';
  subject: { _id: string; name: string; code: string };
  class: { _id: string; name: string; section: string };
  totalMarks: number;
  date: string;
}

interface Result {
  student: { _id: string; rollNo: string; user: { name: string } };
  obtainedMarks: number;
  percentage: number;
  grade: string;
}

export default function ExamsPage() {
  const [showForm, setShowForm] = useState(false);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '', type: 'midterm', subjectId: '', classId: '', totalMarks: '50', date: '',
  });
  const queryClient = useQueryClient();

  const { data: examsData, isLoading } = useQuery<PaginatedResponse<Exam>>({
    queryKey: ['exams'],
    queryFn: async () => (await api.get('/exams?limit=50')).data,
  });

  const { data: classesData } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes?limit=100')).data,
  });

  const { data: subjectsData } = useQuery<PaginatedResponse<SubjectItem>>({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get('/subjects?limit=100')).data,
  });

  const { data: studentsData } = useQuery<PaginatedResponse<StudentProfile>>({
    queryKey: ['students-by-class', form.classId],
    queryFn: async () => (await api.get(`/students?classId=${form.classId}&limit=100`)).data,
    enabled: !!form.classId,
  });

  // Fetch students for expanded exam
  const expandedExamData = examsData?.data?.find((e) => e._id === expandedExam);
  const { data: examStudentsData } = useQuery<PaginatedResponse<StudentProfile>>({
    queryKey: ['students-by-class', expandedExamData?.class?._id],
    queryFn: async () => (await api.get(`/students?classId=${expandedExamData?.class?._id}&limit=100`)).data,
    enabled: !!expandedExamData?.class?._id,
  });

  const { data: existingResultsData } = useQuery({
    queryKey: ['exam-results', expandedExam],
    queryFn: async () => {
      const res = await api.get(`/exams/${expandedExam}/results`);
      const results: Result[] = res.data.data.results;
      const preset: Record<string, string> = {};
      results.forEach((r) => {
        preset[r.student._id] = String(r.obtainedMarks);
      });
      setMarks(preset);
      return res.data.data as { exam: Exam; results: Result[] };
    },
    enabled: !!expandedExam,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/exams', {
        name: form.name,
        type: form.type,
        subjectId: form.subjectId,
        classId: form.classId,
        totalMarks: Number(form.totalMarks),
        date: form.date,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Exam created successfully.');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setForm({ name: '', type: 'midterm', subjectId: '', classId: '', totalMarks: '50', date: '' });
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create exam.');
    },
  });

  const submitResultsMutation = useMutation({
    mutationFn: async (examId: string) => {
      const examStudents = examStudentsData?.data || [];
      const results = examStudents.map((s) => ({
        studentId: s._id,
        obtainedMarks: Number(marks[s._id] || 0),
      }));
      const res = await api.post(`/exams/${examId}/results`, { results });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Results saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save results.');
    },
  });

  const exams = examsData?.data || [];
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const examStudents = examStudentsData?.data || [];

  const gradeColor: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-amber-100 text-amber-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exams & Results</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {examsData?.pagination ? `${examsData.pagination.total} exams` : 'Loading...'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Create Exam'}
        </Button>
      </div>

      {/* Create exam form */}
      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">New Exam</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Exam Name"
              placeholder="e.g. Midterm Exam 2026"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
              <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.program} - {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <Input
              label="Total Marks"
              type="number"
              min={1}
              value={form.totalMarks}
              onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
              required
            />
            <Input
              label="Exam Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <Button type="submit" isLoading={createMutation.isPending}>Create Exam</Button>
        </form>
      )}

      {/* Exams list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No exams created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const isExpanded = expandedExam === exam._id;
            const existingResults: Result[] = existingResultsData?.results || [];

            return (
              <div key={exam._id} className="card overflow-hidden">
                {/* Exam header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-50 transition-colors"
                  onClick={() => {
                    setExpandedExam(isExpanded ? null : exam._id);
                    setMarks({});
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{exam.name}</h3>
                        <Badge variant={exam.type === 'midterm' ? 'info' : 'warning'}>
                          {exam.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exam.subject?.name} ({exam.subject?.code}) • {exam.class?.name} - {exam.class?.section} • Total: {exam.totalMarks} marks • {formatDate(exam.date)}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>

                {/* Results entry */}
                {isExpanded && (
                  <div className="border-t border-surface-100">
                    {examStudents.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">No students in this class.</p>
                    ) : (
                      <>
                        <div className="divide-y divide-surface-100">
                          {examStudents.map((student) => {
                            const existing = existingResults.find((r) => r.student._id === student._id);
                            return (
                              <div key={student._id} className="flex items-center justify-between px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar name={student.user.name} size="sm" />
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{student.user.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{student.rollNo}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {existing && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${gradeColor[existing.grade] || ''}`}>
                                      {existing.grade} ({existing.percentage}%)
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min={0}
                                      max={exam.totalMarks}
                                      placeholder="Marks"
                                      value={marks[student._id] || ''}
                                      onChange={(e) => setMarks((m) => ({ ...m, [student._id]: e.target.value }))}
                                      className="input w-24 text-center text-sm py-1.5"
                                    />
                                    <span className="text-xs text-slate-400">/ {exam.totalMarks}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-5 py-4 border-t border-surface-100 flex justify-end">
                          <Button
                            onClick={() => submitResultsMutation.mutate(exam._id)}
                            isLoading={submitResultsMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                            Save Results
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}