import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken } = res.data;
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);

      // Redirect based on role
      const routes: Record<string, string> = {
        admin: '/dashboard',
        teacher: '/dashboard',
        student: '/my-profile',
      };
      navigate(routes[user.role] || '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-slate-950 px-4 py-3 sm:px-6 sm:py-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-28 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-primary-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Card */}
          <div className="order-2 lg:order-2">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-white/15 bg-white p-5 shadow-2xl sm:p-8">
              <div className="mb-5 sm:mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Sign in</h2>
                <p className="mt-1 text-sm text-slate-500">Enter your credentials to access the portal</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative">
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@institution.edu"
                    error={errors.email?.message}
                    required
                    {...register('email')}
                  />
                  <Mail className="absolute right-3 top-9 h-4 w-4 text-slate-400" />
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    required
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                    Remember me
                  </label>
                  <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  <Lock className="h-4 w-4" />
                  Sign In
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-400 sm:mt-6">
                Contact your administrator if you need access
              </p>
            </div>
          </div>

          {/* Right side branding */}
          <div className="order-1 lg:order-1 lg:pr-6">
            <div className="mx-auto w-full max-w-md text-left">
              <div className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <GraduationCap className="h-8 w-8 text-cyan-200" />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">#logo</p>
                <h1 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">SMS Portal</h1>
                <p className="mt-2 text-sm font-medium text-slate-200 sm:text-base">Student Management System</p>
                <p className="mt-4 max-w-md text-xs text-slate-300/90">
                  Manage students, attendance, results, and fee records from one clean and secure dashboard.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-5 hidden w-full max-w-md gap-2 sm:grid sm:grid-cols-3">
              {['Admin', 'Teacher', 'Student'].map((role) => (
                <div key={role} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
                  <span className="text-xs font-medium text-slate-100">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
