import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Search, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import type { TeacherItem, PaginatedResponse } from '@/types';

export default function TeachersPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    qualification: '',
    department: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<TeacherItem>>({
    queryKey: ['teachers', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return (await api.get(`/teachers?${params}`)).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'teacher',
        qualification: form.qualification,
        department: form.department,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Teacher "${form.name}" registered successfully.`);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setForm({ name: '', email: '', password: '', qualification: '', department: '' });
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register teacher.');
    },
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._teacherSearchTimer);
    (window as any)._teacherSearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    createMutation.mutate();
  };

  const teachers = data?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teachers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data?.pagination ? `${data.pagination.total} teachers registered` : 'Loading...'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Teacher'}
        </Button>
      </div>

      {/* Register form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
            <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">New Teacher</h2>
              <p className="text-xs text-slate-400">An employee ID will be auto-generated</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Dr. Sarah Ahmed"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="teacher@institution.edu"
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
              required
            />
            <Input
              label="Qualification"
              placeholder="e.g. MS Computer Science"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            />
            <Input
              label="Department"
              placeholder="e.g. Software Engineering"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <Button type="submit" isLoading={createMutation.isPending}>
            Register Teacher
          </Button>
        </form>
      )}

      {/* Search */}
      <div className="card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualification</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subjects</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-surface-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    {debouncedSearch ? `No teachers found for "${debouncedSearch}"` : 'No teachers registered yet.'}
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={teacher.user?.name || 'T'} size="sm" />
                        <div>
                          <p className="font-medium text-slate-800">{teacher.user?.name}</p>
                          <p className="text-xs text-slate-400">{teacher.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-surface-100 px-2 py-1 rounded-lg text-slate-600">
                        {teacher.employeeId}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{teacher.department || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{teacher.qualification || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {(teacher as any).subjects?.length || 0} subjects
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={(teacher as any).isActive ? 'success' : 'danger'}>
                        {(teacher as any).isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {formatDate((teacher as any).createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}