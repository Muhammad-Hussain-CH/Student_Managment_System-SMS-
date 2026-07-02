import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { AttendanceSummary } from '@/types/attendance';

interface SubjectSummary extends AttendanceSummary {
  subject: { _id: string; name: string; code: string };
}

export default function MyAttendancePage() {
  const { data, isLoading } = useQuery<SubjectSummary[]>({
    queryKey: ['my-attendance-summary'],
    queryFn: async () => {
      const res = await api.get('/attendance/me/summary');
      return res.data.data;
    },
  });

  const summaries = data || [];
  const hasShortage = summaries.some((s) => s.belowThreshold);
  const averagePercentage = summaries.length > 0 ? Math.round(summaries.reduce((sum, s) => sum + s.percentage, 0) / summaries.length) : 0;
  const subjectsBelow = summaries.filter((s) => s.belowThreshold).length;

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-4">
      <div className="rounded-2xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Student Attendance</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">My Attendance</h1>
            <p className="text-sm text-slate-500">Attendance by subject with a 75% threshold.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="info">Avg {averagePercentage}%</Badge>
            <Badge variant={subjectsBelow > 0 ? 'danger' : 'success'}>
              {subjectsBelow > 0 ? `${subjectsBelow} below` : 'All good'}
            </Badge>
          </div>
        </div>
      </div>

      {!isLoading && summaries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium">Subjects</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summaries.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium">Average Attendance</p>
            <p className={cn('text-2xl font-bold mt-1', averagePercentage >= 75 ? 'text-green-600' : 'text-red-500')}>
              {averagePercentage}%
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium">Below Threshold</p>
            <p className={cn('text-2xl font-bold mt-1', subjectsBelow > 0 ? 'text-red-500' : 'text-green-600')}>
              {subjectsBelow}
            </p>
          </div>
        </div>
      )}

      {hasShortage && (
        <div className="card p-4 border-l-4 border-l-red-500 bg-red-50/50 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Attendance Shortage Warning</p>
            <p className="text-xs text-red-600 mt-0.5">
              You are below 75% in one or more subjects. Contact your teacher immediately.
            </p>
          </div>
        </div>
      )}

      {!isLoading && summaries.length > 0 && !hasShortage && (
        <div className="card p-4 border-l-4 border-l-green-500 bg-green-50/50 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Your attendance is above 75% in all subjects.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No attendance records found yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <div key={s.subject._id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{s.subject.name}</h3>
                      <span className="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded-lg text-slate-500">
                        {s.subject.code}
                      </span>
                      {s.belowThreshold && (
                        <Badge variant="danger">Below 75%</Badge>
                      )}
                    </div>

                    <div className="mt-3 rounded-xl border border-surface-100 bg-surface-50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">{s.total} total classes</span>
                        <span className={`text-sm font-bold ${s.percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                          {s.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${s.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(s.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="relative h-1 mt-0.5">
                        <div
                          className="absolute top-0 w-0.5 h-2 bg-slate-400"
                          style={{ left: '75%' }}
                          title="75% threshold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2.5">
                      <span className="text-xs text-green-600 font-medium">✓ {s.present} Present</span>
                      <span className="text-xs text-red-500 font-medium">✗ {s.absent} Absent</span>
                      <span className="text-xs text-amber-600 font-medium">⏰ {s.late} Late</span>
                      <span className="text-xs text-blue-600 font-medium">📋 {s.leave} Leave</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}   