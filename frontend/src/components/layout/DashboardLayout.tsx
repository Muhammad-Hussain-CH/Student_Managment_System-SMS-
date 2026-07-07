import { useState, useEffect } from 'react';
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
  Shield,
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
    { label: 'Roles', icon: Shield, to: '/roles' },
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 flex-shrink-0">
        <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-800">SMS Portal</span>
          <p className="text-xs text-slate-400">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/my-profile'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-surface-100 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary-600')} />
                <span className="flex-1 truncate">{label}</span>
                {isActive && <ChevronRight className="h-3 w-3 text-primary-400 flex-shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: settings + logout */}
      <div className="border-t border-surface-100 p-3 flex-shrink-0 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-surface-100'
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop sidebar — only renders on large screens */}
      {isDesktop && (
        <aside className="flex flex-col w-56 bg-white border-r border-surface-200 flex-shrink-0 h-screen overflow-hidden">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile sidebar overlay — only renders when open on small screens */}
      {!isDesktop && sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-56 bg-white shadow-xl h-full overflow-hidden">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-surface-200 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          {!isDesktop && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
          )}

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-800">
              {new Date().toLocaleDateString('en-PK', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2.5">
              <Avatar name={user?.name || ''} url={user?.avatar?.url} size="sm" />
              <div>
                <p className="text-sm font-medium text-slate-800 leading-none">{user?.name}</p>
                <Badge variant={roleBadgeVariant[roleKey || 'student']} className="mt-0.5">
                  {roleName || roleKey}
                </Badge>
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