import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, CalendarCheck, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  feeCollection: number;
  recentStudents: Array<{ _id: string; user: { name: string; email: string }; rollNo: string; program: string }>;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
}) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {trendLabel && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendLabel}
          </div>
        )}
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
    // Placeholder until backend endpoint is built in Phase 6
    enabled: false,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {greeting()}, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's what's happening at your institution today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={isLoading ? '—' : stats?.totalStudents ?? '—'}
          icon={Users}
          color="bg-primary-50 text-primary-600"
          trend="up"
          trendLabel="+12 this month"
        />
        <StatCard
          label="Total Teachers"
          value={isLoading ? '—' : stats?.totalTeachers ?? '—'}
          icon={BookOpen}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Attendance Rate"
          value={isLoading ? '—' : `${stats?.attendanceRate ?? '—'}%`}
          icon={CalendarCheck}
          color="bg-green-50 text-green-600"
          trend="down"
          trendLabel="-2% vs last week"
        />
        <StatCard
          label="Fee Collected"
          value={isLoading ? '—' : `PKR ${(stats?.feeCollection ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-amber-50 text-amber-600"
          trend="up"
          trendLabel="85% collected"
        />
      </div>

      {/* Placeholder notice for Phase 1 */}
      <div className="card p-5 border-l-4 border-l-primary-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Phase 1 Complete — Auth & Student CRUD</p>
            <p className="text-sm text-slate-500 mt-1">
              Authentication, role-based access, and student management are live. Dashboard statistics will populate in Phase 6 when the reports module is built.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['✅ Auth & JWT', '✅ Role-based access', '✅ Student CRUD', '🔜 Classes & Subjects', '🔜 Attendance', '🔜 Exams', '🔜 Fees', '🔜 Reports'].map((p) => (
                <span key={p} className="text-xs bg-surface-100 text-slate-600 px-2 py-1 rounded-lg font-mono">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user?.role === 'admin' && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Add Student', icon: Users, to: '/students/new' },
              { label: 'Mark Attendance', icon: CalendarCheck, to: '/attendance' },
              { label: 'Enter Results', icon: BookOpen, to: '/exams' },
              { label: 'Generate Report', icon: TrendingUp, to: '/reports' },
            ].map(({ label, icon: Icon }) => (
              <button key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group">
                <Icon className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-primary-700 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
