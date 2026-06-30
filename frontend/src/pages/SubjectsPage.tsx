import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, BookOpen, UserCheck, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { ClassItem, SubjectItem, TeacherItem, PaginatedResponse } from '@/types';

export default function SubjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', creditHours: '3', classIds: [] as string[] });
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<SubjectItem>>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/subjects?limit=50');
      return res.data;
    },
  });

  const { data: classesData } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes?limit=100');
      return res.data;
    },
  });

  // NOTE: there is no dedicated "list teachers" endpoint yet — this will
  // gracefully fail and show an empty list until that endpoint is added.
  const { data: teachersData } = useQuery<TeacherItem[]>({
    queryKey: ['teachers-lite'],
    queryFn: async () => {
      try {
        const res = await api.get('/teachers?limit=100');
        return res.data.data;
      } catch {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await api.post('/subjects', {
        name: payload.name,
        code: payload.code,
        creditHours: Number(payload.creditHours),
        classes: payload.classIds,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Subject created successfully.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setForm({ name: '', code: '', creditHours: '3', classIds: [] });
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create subject.');
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ subjectId, teacherId }: { subjectId: string; teacherId: string | null }) => {
      const res = await api.patch(`/subjects/${subjectId}/assign-teacher`, { teacherId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Teacher assigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setAssigningId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign teacher.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Name and code are required.');
      return;
    }
    createMutation.mutate(form);
  };

  const toggleClass = (id: string) => {
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(id) ? f.classIds.filter((c) => c !== id) : [...f.classIds, id],
    }));
  };

  const subjects = data?.data || [];
  const classes = classesData?.data || [];
  const teachers = teachersData || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data?.pagination ? `${data.pagination.total} subjects` : 'Loading...'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Subject'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">New Subject</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Subject Name"
              placeholder="e.g. Database Systems"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Code"
              placeholder="e.g. CS-301"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <Input
              label="Credit Hours"
              type="number"
              min={1}
              max={6}
              value={form.creditHours}
              onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
              required
            />
          </div>

          {classes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link to Classes (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <button
                    type="button"
                    key={cls._id}
                    onClick={() => toggleClass(cls._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      form.classIds.includes(cls._id)
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-surface-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    {cls.program} - {cls.section}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" isLoading={createMutation.isPending}>
            Create Subject
          </Button>
        </form>
      )}

      {/* Subjects list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No subjects created yet. Add your first subject above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subj) => (
            <div key={subj._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{subj.name}</h3>
                      <span className="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded-lg text-slate-500">
                        {subj.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {subj.creditHours} credit hours
                      {subj.classes.length > 0 && (
                        <> • {subj.classes.map((c) => `${c.program}-${c.section}`).join(', ')}</>
                      )}
                    </p>

                    {/* Teacher assignment */}
                    <div className="mt-3 flex items-center gap-2">
                      {assigningId === subj._id ? (
                        <select
                          autoFocus
                          className="input text-xs py-1.5 w-56"
                          defaultValue={subj.teacher?._id || ''}
                          onChange={(e) =>
                            assignMutation.mutate({ subjectId: subj._id, teacherId: e.target.value || null })
                          }
                          onBlur={() => setAssigningId(null)}
                        >
                          <option value="">— Unassigned —</option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.user?.name} ({t.employeeId})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setAssigningId(subj._id)}
                          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {subj.teacher ? subj.teacher.user.name : 'Assign teacher'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={subj.isActive ? 'success' : 'danger'}>
                  {subj.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {teachers.length === 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400 bg-amber-50/50">
          <p className="text-xs text-amber-700">
            <GraduationCap className="h-3.5 w-3.5 inline mr-1" />
            No teachers found. Register teachers via Admin → Register, or the teacher list endpoint isn't built yet.
          </p>
        </div>
      )}
    </div>
  );
}