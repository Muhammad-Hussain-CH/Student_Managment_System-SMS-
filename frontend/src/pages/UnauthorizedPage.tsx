import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const roleKey = typeof user?.role === 'object' ? (user?.role as any)?.key : user?.role;

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        <div className="text-6xl font-bold text-red-200 mb-4">403</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm mb-8">
          You don't have permission to access this page. Contact your administrator if you think this is a mistake.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate(roleKey === 'student' ? '/my-profile' : '/dashboard')}>
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}