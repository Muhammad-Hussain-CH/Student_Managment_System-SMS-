import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, BookOpen, CalendarCheck, DollarSign, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { StudentProfile } from '@/types';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
const [editForm, setEditForm] = useState({ name: '', program: '', batch: '' });
const queryClient = useQueryClient();

const deleteMutation = useMutation({
  mutationFn: async () => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
  onSuccess: () => {
    toast.success('Student deactivated successfully.');
    queryClient.invalidateQueries({ queryKey: ['student', id] });
  },
  onError: (err: any) => {
    toast.error(err.response?.data?.message || 'Failed to deactivate student.');
  },
});

const updateMutation = useMutation({
  mutationFn: async () => {
    const res = await api.patch(`/students/${id}`, {
      name: editForm.name,
      program: editForm.program,
      batch: editForm.batch,
    });
    return res.data;
  },
  onSuccess: () => {
    toast.success('Student updated successfully.');
    queryClient.invalidateQueries({ queryKey: ['student', id] });
    setShowEdit(false);
  },
  onError: (err: any) => {
    toast.error(err.response?.data?.message || 'Failed to update student.');
  },
});

const handleDelete = () => {
  if (window.confirm(`Are you sure you want to ${data?.isActive ? 'deactivate' : 'activate'} this student?`)) {
    deleteMutation.mutate();
  }
};

const handleEditOpen = () => {
  setEditForm({
    name: data?.user?.name || '',
    program: data?.program || '',
    batch: data?.batch || '',
  });
  setShowEdit(true);
};

  const { data, isLoading } = useQuery<StudentProfile>({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data.data;
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${id}/summary`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: resultsData } = useQuery({
    queryKey: ['student-results', id],
    queryFn: async () => {
      const res = await api.get(`/exams/student/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: feesData } = useQuery({
    queryKey: ['student-fees', id],
    queryFn: async () => {
      const res = await api.get(`/fees/payments?studentId=${id}&limit=50`);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 h-24 animate-pulse bg-surface-100" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const student = data;
  const attendance = attendanceData as any;
  const results = (resultsData as any[]) || [];
  const fees = (feesData as any[]) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
  <Avatar name={student.user.name} url={student.photo?.url} size="xl" />
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-slate-800">{student.user.name}</h1>
        <Badge variant={student.isActive ? 'success' : 'danger'}>
          {student.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      {useAuthStore.getState().user && (useAuthStore.getState().user?.role as any)?.key === 'admin' && (
        <div className="flex gap-2">
          <button
           onClick={() => handleEditOpen()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 font-medium transition-all"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {student.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )}
    </div>
            <p className="text-sm text-slate-500 mt-1">{student.user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-400">Roll No</p>
                <p className="text-sm font-mono font-medium text-slate-700">{student.rollNo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Program</p>
                <p className="text-sm font-medium text-slate-700">{student.program}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Class</p>
                <p className="text-sm font-medium text-slate-700">
                  {student.class ? `${(student.class as any).name} - ${(student.class as any).section}` : '—'}
                </p>
              </div>
              {student.batch && (
                <div>
                  <p className="text-xs text-slate-400">Batch</p>
                  <p className="text-sm font-medium text-slate-700">{student.batch}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400">Joined</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(student.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
{showEdit && (
  <div className="card p-5 space-y-4">
    <h2 className="text-sm font-semibold text-slate-700">Edit Student</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Input
        label="Full Name"
        value={editForm.name}
        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
      />
      <Input
        label="Program"
        value={editForm.program}
        onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
      />
      <Input
        label="Batch"
        placeholder="e.g. Fall 2024"
        value={editForm.batch}
        onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
      />
    </div>
    <div className="flex gap-3">
      <Button onClick={() => updateMutation.mutate()} isLoading={updateMutation.isPending}>
        Save Changes
      </Button>
      <Button variant="secondary" onClick={() => setShowEdit(false)}>
        Cancel
      </Button>
    </div>
  </div>
)}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Attendance Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-slate-700">Attendance</h2>
          </div>
          {!attendance ? (
            <p className="text-xs text-slate-400">No records yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Percentage</span>
                <span className={`text-sm font-bold ${attendance.percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                  {attendance.percentage}%
                </span>
              </div>
              <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${attendance.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(attendance.percentage, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <p className="text-xs text-green-600">✓ {attendance.present} Present</p>
                <p className="text-xs text-red-500">✗ {attendance.absent} Absent</p>
                <p className="text-xs text-amber-600">⏰ {attendance.late} Late</p>
                <p className="text-xs text-blue-600">📋 {attendance.leave} Leave</p>
              </div>
              {attendance.belowThreshold && (
                <Badge variant="danger" className="mt-2">Below 75%</Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-slate-700">Results</h2>
          </div>
          {results.length === 0 ? (
            <p className="text-xs text-slate-400">No results yet.</p>
          ) : (
            <div className="space-y-2">
              {results.slice(0, 4).map((r: any) => (
                <div key={r._id} className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 truncate flex-1">{r.exam?.subject?.name}</p>
                  <span className={`text-xs font-bold ml-2 px-2 py-0.5 rounded-lg ${
                    r.grade === 'A' ? 'bg-green-100 text-green-700' :
                    r.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                    r.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                    r.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>{r.grade}</span>
                </div>
              ))}
              {results.length > 4 && (
                <p className="text-xs text-slate-400">+{results.length - 4} more</p>
              )}
            </div>
          )}
        </div>

        {/* Fee Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-slate-700">Fees</h2>
          </div>
          {fees.length === 0 ? (
            <p className="text-xs text-slate-400">No fee records yet.</p>
          ) : (
            <div className="space-y-2">
              {fees.slice(0, 4).map((f: any) => (
                <div key={f._id} className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 truncate flex-1">{f.feeStructure?.name}</p>
                  <Badge variant={
                    f.status === 'paid' ? 'success' :
                    f.status === 'overdue' ? 'danger' :
                    f.status === 'partial' ? 'warning' : 'default'
                  }>
                    {f.status}
                  </Badge>
                </div>
              ))}
              {fees.length > 4 && (
                <p className="text-xs text-slate-400">+{fees.length - 4} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      {(student.contact?.phone || student.contact?.address || student.guardian?.name) && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-slate-700">Contact & Guardian</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {student.contact?.phone && (
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm text-slate-700">{student.contact.phone}</p>
              </div>
            )}
            {student.contact?.address && (
              <div>
                <p className="text-xs text-slate-400">Address</p>
                <p className="text-sm text-slate-700">{student.contact.address}</p>
              </div>
            )}
            {student.guardian?.name && (
              <div>
                <p className="text-xs text-slate-400">Guardian</p>
                <p className="text-sm text-slate-700">{student.guardian.name}</p>
              </div>
            )}
            {student.guardian?.phone && (
              <div>
                <p className="text-xs text-slate-400">Guardian Phone</p>
                <p className="text-sm text-slate-700">{student.guardian.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}