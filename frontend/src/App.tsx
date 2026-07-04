import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import StudentsPage from '@/pages/StudentsPage';
import ClassesPage from '@/pages/ClassesPage';
import SubjectsPage from '@/pages/SubjectsPage';
import AttendancePage from '@/pages/AttendancePage';
import AddStudentPage from '@/pages/AddStudentPage';
import { useAuthStore } from '@/store/auth.store';
import MyAttendancePage from '@/pages/MyAttendancePage';
import ExamsPage from '@/pages/ExamsPage';
import MyResultsPage from '@/pages/MyResultsPage';
import TeachersPage from '@/pages/TeachersPage';
import FeesPage from '@/pages/FeesPage';
import MyFeesPage from '@/pages/MyFeesPage';
import MyProfilePage from './pages/MyProfilePage.tsx';
import ReportsPage from '@/pages/ReportsPage';
import StudentDetailPage from '@/pages/StudentDetailPage';
import SettingsPage from '@/pages/SettingsPage';
import RolesPage from '@/pages/RolesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-6">
    <div className="card p-8 text-center">
      <h2 className="text-xl font-semibold text-slate-700">{title}</h2>
      <p className="text-slate-400 text-sm mt-2">This module is coming in the next phase.</p>
    </div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();
  const roleKey = typeof user?.role === 'object' ? (user?.role as any)?.key : user?.role;

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={roleKey === 'student' ? '/my-profile' : '/dashboard'} replace /> : <LoginPage />}
      />

      {/* Admin + Teacher */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/new" element={<AddStudentPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/roles" element={<RolesPage />} />
        </Route>
      </Route>

      {/* Student self-portal */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/my-profile" element={<MyProfilePage />} />
          <Route path="/my-attendance" element={<MyAttendancePage />} />
          <Route path="/my-results" element={<MyResultsPage />} />
          <Route path="/my-fees" element={<MyFeesPage />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<Placeholder title="403 — Access Denied" />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? (roleKey === 'student' ? '/my-profile' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Placeholder title="404 — Page Not Found" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '13px', borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
            success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}