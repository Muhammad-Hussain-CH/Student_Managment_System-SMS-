import { useQuery } from '@tanstack/react-query';
import {
  UserCircle2,
  BadgeCheck,
  CalendarDays,
  Phone,
  MapPin,
  Users,
  BookOpen,
  Home,
  Mail,
  ShieldCheck,
  Clock3,
  Hash,
} from 'lucide-react';
import api from '@/lib/axios';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';
import type { ApiResponse, StudentProfile } from '@/types';

const InfoCard = ({
  icon: Icon,
  label,
  value,
  accent = 'text-slate-600',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0">
        <Icon className={cn('h-5 w-5', accent)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800 break-words">{value}</p>
      </div>
    </div>
  </div>
);

export default function MyProfilePage() {
  const { data, isLoading, error } = useQuery<ApiResponse<StudentProfile>>({
    queryKey: ['my-profile'],
    queryFn: async () => (await api.get('/students/me')).data,
  });

  const profile = data?.data;

  const fullAddress = [profile?.contact?.address, profile?.contact?.city].filter(Boolean).join(', ');
  const guardianSummary = [profile?.guardian?.name, profile?.guardian?.relation].filter(Boolean).join(' • ');

  return (
    <div className="p-5 max-w-7xl mx-auto h-full overflow-hidden space-y-4">
      <div className="rounded-2xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Student Profile</p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">My Profile</h1>
              <p className="text-sm text-slate-500 truncate">Academic and personal information in one place</p>
            </div>
          </div>

          {profile && (
            <div className="flex gap-2 flex-wrap sm:justify-end">
              <Badge variant={profile.isActive ? 'success' : 'danger'}>
                <ShieldCheck className="h-3 w-3 mr-1" />
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {profile.batch && <Badge variant="info">Batch {profile.batch}</Badge>}
              <Badge variant="default">Roll {profile.rollNo}</Badge>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
          <div className="card p-5 h-[calc(100vh-240px)] min-h-[420px] animate-pulse bg-surface-100" />
          <div className="space-y-4">
            <div className="card p-5 h-28 animate-pulse bg-surface-100" />
            <div className="card p-5 h-[calc(100vh-360px)] min-h-[300px] animate-pulse bg-surface-100" />
          </div>
        </div>
      ) : error || !profile ? (
        <div className="card p-8 text-center">
          <UserCircle2 className="h-11 w-11 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-800">Profile not found</h2>
          <p className="text-sm text-slate-500 mt-1">We couldn’t load your student profile right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px,1fr] items-start">
          <div className="card p-5 bg-white/95 h-full">
            <div className="flex flex-col items-center text-center">
              <Avatar name={profile.user.name} url={profile.photo?.url || profile.user.avatar?.url} size="xl" />
              <h2 className="mt-3 text-lg font-bold text-slate-800 leading-tight">{profile.user.name}</h2>
              <p className="text-sm text-slate-500">{profile.user.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge variant="default">Student</Badge>
                <Badge variant="info">{profile.program}</Badge>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-surface-50 border border-surface-100 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Class</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profile.class ? `${profile.class.name} - ${profile.class.section}` : 'Not assigned'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Roll No</p>
                  <p className="mt-1 font-semibold text-slate-800">{profile.rollNo}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Batch</p>
                  <p className="mt-1 font-semibold text-slate-800">{profile.batch || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-1 border-t border-surface-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Joined {formatDate(profile.createdAt)}
                </div>
                {profile.user.lastLogin && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    Last login {formatDate(profile.user.lastLogin)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 min-h-0">
            <div className="card p-5 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Profile Details</h2>
                  <p className="text-xs text-slate-500">Personal and student information</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoCard icon={BookOpen} label="Program" value={profile.program} accent="text-blue-600" />
                <InfoCard
                  icon={Users}
                  label="Guardian"
                  value={guardianSummary || 'Not provided'}
                  accent="text-violet-600"
                />
                <InfoCard
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={profile.dob ? formatDate(profile.dob) : 'Not provided'}
                  accent="text-amber-600"
                />
                <InfoCard
                  icon={Phone}
                  label="Phone"
                  value={profile.contact?.phone || 'Not provided'}
                  accent="text-cyan-600"
                />
                <InfoCard
                  icon={MapPin}
                  label="Address"
                  value={fullAddress || 'Not provided'}
                  accent="text-rose-600"
                />
                <InfoCard
                  icon={Mail}
                  label="Email"
                  value={profile.user.email}
                  accent="text-slate-600"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Guardian Contact</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-800">Name:</span> {profile.guardian?.name || 'Not provided'}</p>
                  <p><span className="font-medium text-slate-800">Relation:</span> {profile.guardian?.relation || 'Not provided'}</p>
                  <p><span className="font-medium text-slate-800">Phone:</span> {profile.guardian?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Account Status</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-800">Role:</span> {profile.user.role}</p>
                  <p><span className="font-medium text-slate-800">Status:</span> {profile.isActive ? 'Active' : 'Inactive'}</p>
                  <p><span className="font-medium text-slate-800">Created:</span> {formatDate(profile.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
