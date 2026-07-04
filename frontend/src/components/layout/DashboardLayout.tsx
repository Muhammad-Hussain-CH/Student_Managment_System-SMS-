import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  FileText,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Layers,
} from 'lucide-react';

const navItems: Record<string, { label: string; icon: any; to: string }[]> = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Students', icon: Users, to: '/students' },
    { label: 'Classes', icon: Layers, to: '/classes' },
    { label: 'Subjects', icon: BookOpen, to: '/subjects' },
    { label: 'Teachers', icon: BookOpen, to: '/teachers' },
    { label: 'Attendance', icon: CalendarCheck, to: '/attendance' },
    { label: 'Exams & Results', icon: FileText, to: '/exams' },
    { label: 'Fee Management', icon: DollarSign, to: '/fees' },
    { label: 'Reports', icon: BarChart3, to: '/reports' },
  ],
  teacher: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'My Students', icon: Users, to: '/students' },
    { label: 'Attendance', icon: CalendarCheck, to: '/attendance' },
    { label: 'Results Entry', icon: FileText, to: '/exams' },
  ],
  student: [
    { label: 'My Profile', icon: Users, to: '/my-profile' },
    { label: 'Attendance', icon: CalendarCheck, to: '/my-attendance' },
    { label: 'Results', icon: FileText, to: '/my-results' },
    { label: 'Fee Status', icon: DollarSign, to: '/my-fees' },
  ],
};

const roleBadgeVariant: Record<string, 'info' | 'warning' | 'success'> = {
  admin: 'info',
  teacher: 'warning',
  student: 'success',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleKey = typeof user?.role === 'object' ? (user?.role as any)?.key : user?.role;
  const roleName = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const items = navItems[roleKey || 'student'] || navItems['student'];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-100">
        <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-800">SMS Portal</span>
          <p className="text-xs text-slate-400">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-surface-100 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary-600')} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="h-3 w-3 text-primary-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className="border-t border-surface-100 p-3 space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-surface-100 transition-all"
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <div className="flex items-center gap-3 px-3 py-3 mt-1 bg-surface-50 rounded-xl">
          <Avatar name={user?.name || ''} url={user?.avatar?.url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
            <Badge variant={roleBadgeVariant[roleKey || 'student']} className="mt-0.5">
              {roleName || roleKey}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-surface-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-60 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-surface-200 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-800">
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2.5">
              <Avatar name={user?.name || ''} url={user?.avatar?.url} size="sm" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-800 leading-none">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{roleName || roleKey}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}