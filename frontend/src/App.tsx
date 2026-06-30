import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import StudentsPage from '@/pages/StudentsPage';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
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
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Admin + Teacher */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/new" element={<Placeholder title="Register New Student" />} />
          <Route path="/students/:id" element={<Placeholder title="Student Detail" />} />
          <Route path="/teachers" element={<Placeholder title="Teachers — Phase 2" />} />
          <Route path="/attendance" element={<Placeholder title="Attendance — Phase 3" />} />
          <Route path="/exams" element={<Placeholder title="Exams & Results — Phase 4" />} />
          <Route path="/fees" element={<Placeholder title="Fee Management — Phase 5" />} />
          <Route path="/reports" element={<Placeholder title="Reports & Analytics — Phase 6" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>
      </Route>

      {/* Student self-portal */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/my-profile" element={<Placeholder title="My Profile" />} />
          <Route path="/my-attendance" element={<Placeholder title="My Attendance" />} />
          <Route path="/my-results" element={<Placeholder title="My Results" />} />
          <Route path="/my-fees" element={<Placeholder title="My Fee Status" />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<Placeholder title="403 — Access Denied" />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
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
