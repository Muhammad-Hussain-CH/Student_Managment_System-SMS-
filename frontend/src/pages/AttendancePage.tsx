import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Save, Check, X, Clock, FileWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { ClassItem, SubjectItem, StudentProfile, PaginatedResponse } from '@/types';
import type { AttendanceStatus, AttendanceRecord } from '@/types/attendance';

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; color: string; activeColor: string }> = {
  present: { label: 'Present', icon: Check, color: 'text-green-600 border-green-200', activeColor: 'bg-green-600 border-green-600 text-white' },
  absent: { label: 'Absent', icon: X, color: 'text-red-500 border-red-200', activeColor: 'bg-red-500 border-red-500 text-white' },
  late: { label: 'Late', icon: Clock, color: 'text-amber-600 border-amber-200', activeColor: 'bg-amber-500 border-amber-500 text-white' },
  leave: { label: 'Leave', icon: FileWarning, color: 'text-blue-600 border-blue-200', activeColor: 'bg-blue-500 border-blue-500 text-white' },
};

export default function AttendancePage() {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const queryClient = useQueryClient();
  

  const { data: classesData } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes?limit=50')).data,
  });

  const { data: subjectsData } = useQuery<PaginatedResponse<SubjectItem>>({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get('/subjects?limit=50')).data,
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery<PaginatedResponse<StudentProfile>>({
    queryKey: ['students-by-class', classId],
    queryFn: async () => (await api.get(`/students?classId=${classId}&limit=100`)).data,
    enabled: !!classId,
  });

  const { data: existingData } = useQuery<{ data: AttendanceRecord[] }>({
    queryKey: ['attendance-existing', subjectId, classId, date],
    queryFn: async () => (await api.get(`/attendance?subjectId=${subjectId}&classId=${classId}&date=${date}`)).data,
    enabled: !!subjectId && !!classId && !!date,
  });

  const students = studentsData?.data || [];
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const markedCount = students.filter((s) => !!marks[s._id]).length;
  const presentCount = students.filter((s) => marks[s._id] === 'present').length;
  const absentCount = students.filter((s) => marks[s._id] === 'absent').length;
  const lateCount = students.filter((s) => marks[s._id] === 'late').length;
  const leaveCount = students.filter((s) => marks[s._id] === 'leave').length;

  useEffect(() => {
    if (existingData?.data) {
      const preset: Record<string, AttendanceStatus> = {};
      existingData.data.forEach((r) => {
        preset[r.student._id] = r.status;
      });
      setMarks((prev) => ({ ...preset, ...prev }));
    }
  }, [existingData]);

  useEffect(() => {
    setMarks({});
  }, [classId, subjectId, date]);

  const markAllAs = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (next[s._id] = status));
    setMarks(next);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const records = students.map((s) => ({
        studentId: s._id,
        status: marks[s._id] || 'absent',
      }));
      const res = await api.post('/attendance/mark', { subjectId, classId, date, records });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['attendance-existing'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    },
  });

  const canMark = classId && subjectId && date && students.length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-white via-primary-50 to-cyan-50 p-4 sm:p-5">
        <div className="absolute -top-16 -right-12 h-32 w-32 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="relative">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Attendance Workspace</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Choose class, subject, and date to mark attendance quickly.</p>
        </div>
      </div>

      <div className="card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
          <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.program} - {c.section} {c.semester ? `(Sem ${c.semester})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {!classId || !subjectId ? (
        <div className="card p-12 text-center">
          <CalendarCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Select a class and subject to load students.</p>
        </div>
      ) : studentsLoading ? (
        <div className="card p-8 text-center text-slate-400 text-sm">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500 text-sm">No students found in this class.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="card p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Students</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{students.length}</p>
            </div>
            <div className="card p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Marked</p>
              <p className="text-xl font-bold text-primary-600 mt-1">{markedCount}</p>
            </div>
            <div className="card p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Present</p>
              <p className="text-xl font-bold text-green-600 mt-1">{presentCount}</p>
            </div>
            <div className="card p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Absent</p>
              <p className="text-xl font-bold text-red-500 mt-1">{absentCount}</p>
            </div>
            <div className="card p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Late</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{lateCount}</p>
            </div>
            <div className="card p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Leave</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{leaveCount}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b border-surface-100 bg-surface-50">
              <p className="text-xs text-slate-500 font-medium">Tap a status icon for each student</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMarks({})}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 font-medium"
                >
                  Clear all
                </button>
                <button
                  onClick={() => markAllAs('present')}
                  className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium"
                >
                  Mark all Present
                </button>
                <button
                  onClick={() => markAllAs('absent')}
                  className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium"
                >
                  Mark all Absent
                </button>
              </div>
            </div>

            <div className="px-5 py-2.5 border-b border-surface-100 bg-white">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                  const { label, color, icon: Icon } = statusConfig[status];
                  return (
                    <span key={status} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium', color)}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-surface-100 max-h-[55vh] overflow-y-auto">
              {students.map((student) => (
                <div key={student._id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={student.user.name} url={student.photo?.url} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{student.user.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{student.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                      const { icon: Icon, color, activeColor } = statusConfig[status];
                      const isActive = marks[student._id] === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setMarks((m) => ({ ...m, [student._id]: status }))}
                          title={statusConfig[status].label}
                          className={cn(
                            'h-8 w-8 rounded-lg border flex items-center justify-center transition-all',
                            isActive ? activeColor : `${color} hover:bg-surface-50`
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-surface-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white">
              <p className="text-xs text-slate-500">
                Marked {markedCount} of {students.length} students
              </p>
              <Button onClick={() => submitMutation.mutate()} isLoading={submitMutation.isPending} disabled={!canMark}>
                <Save className="h-4 w-4" />
                Save Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}