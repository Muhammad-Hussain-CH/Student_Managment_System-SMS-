import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import type { ClassItem, StudentProfile, PaginatedResponse } from '@/types';

interface FeeStructure {
  _id: string;
  name: string;
  amount: number;
  dueDate: string;
  finePerDay: number;
  assignedTo: string;
  classes: Array<{ _id: string; name: string; section: string }>;
}

interface FeePayment {
  _id: string;
  student: { _id: string; rollNo: string; user: { name: string; email: string } };
  feeStructure: { _id: string; name: string; amount: number; dueDate: string; finePerDay: number };
  amountDue: number;
  fineAmount: number;
  totalDue: number;
  amountPaid: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidOn?: string;
  challanNo: string;
}

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  paid: 'success',
  overdue: 'danger',
  partial: 'warning',
  pending: 'default',
};

export default function FeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: '',
    finePerDay: '100',
    assignedTo: 'class',
    classIds: [] as string[],
    studentIds: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data: structuresData } = useQuery<PaginatedResponse<FeeStructure>>({
    queryKey: ['fee-structures'],
    queryFn: async () => (await api.get('/fees/structures')).data,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<PaginatedResponse<FeePayment>>({
    queryKey: ['fee-payments', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      return (await api.get(`/fees/payments?${params}`)).data;
    },
  });

  const { data: classesData } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes?limit=100')).data,
  });

  const { data: studentsData } = useQuery<PaginatedResponse<StudentProfile>>({
    queryKey: ['students'],
    queryFn: async () => (await api.get('/students?limit=100')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fees/structures', {
        name: form.name,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        finePerDay: Number(form.finePerDay),
        assignedTo: form.assignedTo,
        classes: form.classIds,
        students: form.studentIds,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Fee created. ${data.data.paymentsCreated} payment records generated.`);
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      setForm({ name: '', amount: '', dueDate: '', finePerDay: '100', assignedTo: 'class', classIds: [], studentIds: [] });
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create fee.');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await api.patch(`/fees/payments/${paymentId}/pay`, {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment marked as paid.');
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to mark payment.');
    },
  });

  const updateOverdueMutation = useMutation({
    mutationFn: async () => (await api.patch('/fees/payments/update-overdue', {})).data,
    onSuccess: (data) => {
      toast.success(`${data.data.updatedCount} payments marked as overdue.`);
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
    },
  });

  const toggleClass = (id: string) =>
    setForm((f) => ({ ...f, classIds: f.classIds.includes(id) ? f.classIds.filter((c) => c !== id) : [...f.classIds, id] }));

  const toggleStudent = (id: string) =>
    setForm((f) => ({ ...f, studentIds: f.studentIds.includes(id) ? f.studentIds.filter((s) => s !== id) : [...f.studentIds, id] }));

  const classes = classesData?.data || [];
  const students = studentsData?.data || [];
  const payments = paymentsData?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fee Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {paymentsData?.pagination ? `${paymentsData.pagination.total} payment records` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => updateOverdueMutation.mutate()} isLoading={updateOverdueMutation.isPending}>
            Update Overdue
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Create Fee'}
          </Button>
        </div>
      </div>

      {/* Create fee form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">New Fee Structure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fee Name"
              placeholder="e.g. Tuition Fee - Fall 2026"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Amount (PKR)"
              type="number"
              min={0}
              placeholder="e.g. 25000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
            <Input
              label="Fine Per Day (PKR)"
              type="number"
              min={0}
              value={form.finePerDay}
              onChange={(e) => setForm({ ...form, finePerDay: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="class">Class</option>
                <option value="student">Student</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {(form.assignedTo === 'class' || form.assignedTo === 'both') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Classes</label>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => toggleClass(c._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      form.classIds.includes(c._id)
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-surface-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    {c.program} - {c.section}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(form.assignedTo === 'student' || form.assignedTo === 'both') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Students</label>
              <div className="flex flex-wrap gap-2">
                {students.map((s) => (
                  <button
                    type="button"
                    key={s._id}
                    onClick={() => toggleStudent(s._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      form.studentIds.includes(s._id)
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-surface-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    {s.user?.name} ({s.rollNo})
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>
            Create Fee Structure
          </Button>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'paid', 'overdue', 'partial'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              statusFilter === s
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'border-surface-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Payments table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Challan</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fine</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paymentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-surface-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={payment.student?.user?.name || 'S'} size="sm" />
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{payment.student?.user?.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{payment.student?.rollNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{payment.feeStructure?.name}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-surface-100 px-2 py-1 rounded-lg text-slate-600">
                        {payment.challanNo}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">PKR {payment.amountDue?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-red-500">
                      {payment.fineAmount > 0 ? `PKR ${payment.fineAmount?.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                      PKR {payment.totalDue?.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(payment.feeStructure?.dueDate)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant[payment.status] || 'default'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {payment.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => markPaidMutation.mutate(payment._id)}
                          isLoading={markPaidMutation.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Paid
                        </Button>
                      )}
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