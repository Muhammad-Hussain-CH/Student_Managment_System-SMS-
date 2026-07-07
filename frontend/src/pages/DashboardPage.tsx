import { useQuery } from '@tanstack/react-query';
import {
  Users, BookOpen, CalendarCheck, DollarSign,
  TrendingUp, TrendingDown, GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  feeCollected: number;
  feePending: number;
  recentStudents: Array<{
    _id: string;
    rollNo: string;
    program: string;
    user: { name: string; email: string };
    createdAt: string;
  }>;
}

const StatCard = ({
  label, value, icon: Icon, color, trend, trendLabel,
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
  const roleKey = typeof user?.role === 'object' ? (user?.role as any)?.key : user?.role;

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
    enabled: roleKey === 'admin',
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {greeting()}, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's what's happening at your institution today.
        </p>
      </div>

      {/* Admin stats */}
      {roleKey === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={isLoading ? '...' : stats?.totalStudents ?? 0}
            icon={Users}
            color="bg-primary-50 text-primary-600"
            trend="up"
            trendLabel="Active enrollments"
          />
          <StatCard
            label="Total Teachers"
            value={isLoading ? '...' : stats?.totalTeachers ?? 0}
            icon={GraduationCap}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Attendance Rate"
            value={isLoading ? '...' : `${stats?.attendanceRate ?? 0}%`}
            icon={CalendarCheck}
            color="bg-green-50 text-green-600"
            trend={stats?.attendanceRate && stats.attendanceRate >= 75 ? 'up' : 'down'}
            trendLabel={stats?.attendanceRate && stats.attendanceRate < 75 ? 'Below threshold' : 'On track'}
          />
          <StatCard
            label="Fee Collected"
            value={isLoading ? '...' : `PKR ${(stats?.feeCollected ?? 0).toLocaleString()}`}
            icon={DollarSign}
            color="bg-amber-50 text-amber-600"
            trend="up"
            trendLabel={`PKR ${(stats?.feePending ?? 0).toLocaleString()} pending`}
          />
        </div>
      )}

      {/* Admin quick actions */}
      {roleKey === 'admin' && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Add Student', icon: Users, to: '/students/new' },
              { label: 'Mark Attendance', icon: CalendarCheck, to: '/attendance' },
              { label: 'Enter Results', icon: BookOpen, to: '/exams' },
              { label: 'Manage Fees', icon: DollarSign, to: '/fees' },
            ].map(({ label, icon: Icon, to }) => (
              <Link
                key={label}
                to={to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <Icon className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-primary-700 text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Teacher quick actions */}
      {roleKey === 'teacher' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Mark Attendance', icon: CalendarCheck, to: '/attendance' },
                { label: 'Enter Results', icon: BookOpen, to: '/exams' },
                { label: 'View Students', icon: Users, to: '/students' },
              ].map(({ label, icon: Icon, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <Icon className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-xs font-medium text-slate-600 group-hover:text-primary-700 text-center">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Students — admin only */}
      {roleKey === 'admin' && !isLoading && stats?.recentStudents && stats.recentStudents.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-slate-700">Recently Registered Students</h2>
            <Link to="/students" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {stats.recentStudents.map((student) => (
              <div key={student._id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={student.user?.name || 'S'} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{student.user?.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{student.rollNo} • {student.program}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{formatDate(student.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}