import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Users, Layers, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { ClassItem, PaginatedResponse } from '@/types';

export default function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState({ name: '', section: '', program: '', semester: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes?limit=50');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/classes', {
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Class created successfully.');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create class.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/classes/${editingClass?._id}`, {
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Class updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update class.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (classId: string) => {
      const res = await api.delete(`/classes/${classId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Class deactivated successfully.');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate class.');
    },
  });

  const resetForm = () => {
    setForm({ name: '', section: '', program: '', semester: '' });
    setShowForm(false);
    setEditingClass(null);
  };

  const handleEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setForm({
      name: cls.name,
      section: cls.section,
      program: cls.program,
      semester: cls.semester ? String(cls.semester) : '',
    });
    setShowForm(true);
  };

  const handleDelete = (cls: ClassItem) => {
    if (window.confirm(`Deactivate class "${cls.name} - ${cls.section}"?`)) {
      deleteMutation.mutate(cls._id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.section || !form.program) {
      toast.error('Name, section, and program are required.');
      return;
    }
    if (editingClass) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const classes = data?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Classes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data?.pagination ? `${data.pagination.total} classes` : 'Loading...'}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Class'}
        </Button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            {editingClass ? `Edit: ${editingClass.name}` : 'New Class'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Class Name"
              placeholder="e.g. BSSE 5th Semester"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Program"
              placeholder="e.g. BSSE"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              required
            />
            <Input
              label="Section"
              placeholder="e.g. A"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              required
            />
            <Input
              label="Semester"
              type="number"
              min={1}
              max={8}
              placeholder="e.g. 5"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingClass ? 'Update Class' : 'Create Class'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Grid of classes */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="card p-12 text-center">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No classes created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls._id} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={cls.isActive ? 'success' : 'danger'}>
                    {cls.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800">{cls.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {cls.program} • Section {cls.section}
                {cls.semester && ` • Sem ${cls.semester}`}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Users className="h-3 w-3" />
                {cls.classTeacher?.user?.name || 'No class teacher assigned'}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(cls)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 font-medium transition-all"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cls)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {cls.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}