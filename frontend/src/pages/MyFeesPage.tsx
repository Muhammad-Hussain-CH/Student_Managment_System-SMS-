import { useQuery } from '@tanstack/react-query';
import { DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface MyPayment {
  _id: string;
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

const statusIcon: Record<string, any> = {
  paid: CheckCircle,
  overdue: AlertTriangle,
  partial: Clock,
  pending: Clock,
};

export default function MyFeesPage() {
  const { data, isLoading } = useQuery<MyPayment[]>({
    queryKey: ['my-fees'],
    queryFn: async () => {
      const res = await api.get('/fees/me');
      return res.data.data;
    },
  });

  const payments = data || [];
  const hasOverdue = payments.some((p) => p.status === 'overdue');
  const totalPaid = payments.filter((p) => p.status === 'paid').length;
  const totalOverdue = payments.filter((p) => p.status === 'overdue').length;
  const totalPending = payments
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + p.totalDue, 0);

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-4">
      <div className="rounded-2xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Student Fees</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">My Fee Status</h1>
            <p className="text-sm text-slate-500">Payment records, fines, and challan status.</p>
          </div>
          {payments.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="success">Paid {totalPaid}</Badge>
              <Badge variant={totalOverdue > 0 ? 'danger' : 'info'}>Overdue {totalOverdue}</Badge>
              <Badge variant="warning">Pending PKR {totalPending.toLocaleString()}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Overdue alert */}
      {hasOverdue && (
        <div className="card p-4 border-l-4 border-l-red-500 bg-red-50/50 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Overdue Payment</p>
            <p className="text-xs text-red-600 mt-0.5">
              You have overdue fees. Late fines are being applied. Please pay immediately.
            </p>
          </div>
        </div>
      )}

      {/* Summary card */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium">Total Records</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{payments.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {payments.filter((p) => p.status === 'paid').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium">Total Pending</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              PKR {totalPending.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Payment cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-4 h-24 animate-pulse bg-surface-100" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-10 text-center">
          <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No fee records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const Icon = statusIcon[payment.status] || Clock;
            return (
              <div key={payment._id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{payment.feeStructure?.name}</h3>
                        <Badge variant={statusVariant[payment.status] || 'default'}>
                          <Icon className="h-3 w-3 inline mr-1" />
                          {payment.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Challan: <span className="font-mono bg-surface-100 px-1.5 py-0.5 rounded">{payment.challanNo}</span>
                        {' '}• Due: {formatDate(payment.feeStructure?.dueDate)}
                      </p>

                      {/* Amount breakdown */}
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-surface-50 rounded-xl p-2.5">
                          <p className="text-xs text-slate-400">Amount Due</p>
                          <p className="text-sm font-semibold text-slate-700 mt-0.5">
                            PKR {payment.amountDue?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-surface-50 rounded-xl p-2.5">
                          <p className="text-xs text-slate-400">Fine</p>
                          <p className={`text-sm font-semibold mt-0.5 ${payment.fineAmount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {payment.fineAmount > 0 ? `PKR ${payment.fineAmount?.toLocaleString()}` : '—'}
                          </p>
                        </div>
                        <div className="bg-surface-50 rounded-xl p-2.5">
                          <p className="text-xs text-slate-400">Total Due</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                            PKR {payment.totalDue?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-surface-50 rounded-xl p-2.5">
                          <p className="text-xs text-slate-400">Amount Paid</p>
                          <p className={`text-sm font-semibold mt-0.5 ${payment.amountPaid > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                            {payment.amountPaid > 0 ? `PKR ${payment.amountPaid?.toLocaleString()}` : '—'}
                          </p>
                        </div>
                      </div>

                      {payment.paidOn && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Paid on {formatDate(payment.paidOn)}
                        </p>
                      )}
                    </div>
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