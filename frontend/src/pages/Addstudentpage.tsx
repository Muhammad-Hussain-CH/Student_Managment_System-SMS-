import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ClassItem, PaginatedResponse } from '@/types';

export default function AddStudentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    program: '',
    classId: '',
  });

  const { data: classesData } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes?limit=100')).data,
  });
  const classes = classesData?.data || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/register', {
  name: form.name,
  email: form.email,
  password: form.password,
  roleKey: 'student',
  program: form.program,
});
      return res.data;
    },
    onSuccess: async (data) => {
      toast.success(`Student "${form.name}" registered successfully.`);

      if (form.classId && data?.user?._id) {
        try {
          const studentsRes = await api.get(`/students?search=${encodeURIComponent(form.email)}`);
          const student = studentsRes.data.data?.[0];
          if (student) {
            await api.patch(`/students/${student._id}`, { classId: form.classId });
          }
        } catch {
          toast.error('Student created, but class assignment failed. Assign manually from Students page.');
        }
      }

      navigate('/students');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register student.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.program) {
      toast.error('Name, email, password, and program are required.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Register New Student</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Creates a login account and student profile in one step.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Student Details</h2>
            <p className="text-xs text-slate-400">A roll number will be auto-generated</p>
          </div>
        </div>

        <Input
          label="Full Name"
          placeholder="e.g. Hamza Khan"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="student@institution.edu"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <Input
          label="Temporary Password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          hint="The student can change this after their first login."
          required
        />

        <Input
          label="Program"
          placeholder="e.g. BSSE"
          value={form.program}
          onChange={(e) => setForm({ ...form, program: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Assign to Class <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            className="input"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">No class — assign later</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.program} - {c.section} {c.semester ? `(Sem ${c.semester})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={createMutation.isPending} className="flex-1">
            Register Student
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/students')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}