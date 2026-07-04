import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Shield, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface Permission {
  key: string;
  label: string;
}

interface Role {
  _id: string;
  name: string;
  key: string;
  permissions: string[];
  homeRoute: string;
  isActive: boolean;
  createdAt: string;
}

const coreRoles = ['admin', 'teacher', 'student'];

export default function RolesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: '',
    key: '',
    permissions: [] as string[],
    homeRoute: '/dashboard',
  });
  const queryClient = useQueryClient();

  const { data: rolesData, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data.data,
  });

  const { data: permissionsData } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/roles/permissions/list')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/roles', form);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role created successfully.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create role.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/roles/${editingRole?._id}`, {
        name: form.name,
        permissions: form.permissions,
        homeRoute: form.homeRoute,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const res = await api.delete(`/roles/${roleId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete role.');
    },
  });

  const resetForm = () => {
    setForm({ name: '', key: '', permissions: [], homeRoute: '/dashboard' });
    setShowForm(false);
    setEditingRole(null);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      key: role.key,
      permissions: role.permissions,
      homeRoute: role.homeRoute,
    });
    setShowForm(true);
  };

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Role name is required.');
      return;
    }
    if (!editingRole && !form.key) {
      toast.error('Role key is required.');
      return;
    }
    if (editingRole) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const roles = rolesData || [];
  const permissions = permissionsData || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roles & Permissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage system roles and their permissions.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Create Role'}
        </Button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            {editingRole ? `Edit Role: ${editingRole.name}` : 'New Role'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Role Name"
              placeholder="e.g. Serving Staff"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Role Key"
              placeholder="e.g. serving_staff"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              hint="Lowercase, underscores only. Cannot be changed after creation."
              disabled={!!editingRole}
              required={!editingRole}
            />
            <Input
              label="Home Route"
              placeholder="e.g. /dashboard"
              value={form.homeRoute}
              onChange={(e) => setForm({ ...form, homeRoute: e.target.value })}
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissions.map((p) => (
                <label
                  key={p.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.permissions.includes(p.key)
                      ? 'bg-primary-50 border-primary-300'
                      : 'border-surface-200 hover:border-primary-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                    className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.label}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.key}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Roles list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const isCore = coreRoles.includes(role.key);
            return (
              <div key={role._id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{role.name}</h3>
                        <span className="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded-lg text-slate-500">
                          {role.key}
                        </span>
                        {isCore && (
                          <Badge variant="info">Core</Badge>
                        )}
                        <Badge variant={role.isActive ? 'success' : 'danger'}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Home: <span className="font-mono">{role.homeRoute}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {role.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {!isCore && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMutation.mutate(role._id)}
                        isLoading={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}