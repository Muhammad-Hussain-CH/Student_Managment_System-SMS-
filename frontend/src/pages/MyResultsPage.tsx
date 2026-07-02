import { useQuery } from '@tanstack/react-query';
import { FileText, Award } from 'lucide-react';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface MyResult {
  _id: string;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  exam: {
    _id: string;
    name: string;
    type: 'midterm' | 'final';
    totalMarks: number;
    date: string;
    subject: { name: string; code: string };
    class: { name: string; section: string };
  };
}

const gradeColor: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  A: 'success',
  B: 'info',
  C: 'warning',
  D: 'default',
  F: 'danger',
};

export default function MyResultsPage() {
  const { data, isLoading } = useQuery<MyResult[]>({
    queryKey: ['my-results'],
    queryFn: async () => {
      const res = await api.get('/exams/me/results');
      return res.data.data;
    },
  });

  const results = data || [];
  const averagePercentage = results.length > 0 ? Math.round(results.reduce((sum, result) => sum + result.percentage, 0) / results.length) : 0;
  const passedCount = results.filter((result) => result.grade !== 'F').length;

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-4">
      <div className="rounded-2xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Student Results</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">My Results</h1>
            <p className="text-sm text-slate-500">Exam results, grades, and score breakdowns.</p>
          </div>
          {results.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="info">Avg {averagePercentage}%</Badge>
              <Badge variant={passedCount === results.length ? 'success' : 'warning'}>
                {passedCount}/{results.length} passed
              </Badge>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No results available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result._id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{result.exam.name}</h3>
                      <Badge variant={result.exam.type === 'midterm' ? 'info' : 'warning'}>
                        {result.exam.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {result.exam.subject?.name} ({result.exam.subject?.code}) •{' '}
                      {result.exam.class?.name} - {result.exam.class?.section} •{' '}
                      {formatDate(result.exam.date)}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3 rounded-xl border border-surface-100 bg-surface-50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">
                          {result.obtainedMarks} / {result.exam.totalMarks} marks
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {result.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all"
                          style={{ width: `${Math.min(result.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {result.remarks && (
                      <p className="text-xs text-slate-400 mt-2 italic">"{result.remarks}"</p>
                    )}
                  </div>
                </div>

                {/* Grade badge */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className={`text-2xl font-bold px-4 py-2 rounded-xl ${
                    result.grade === 'A' ? 'bg-green-100 text-green-700' :
                    result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                    result.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                    result.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.grade}
                  </span>
                  <span className="text-xs text-slate-400">Grade</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}