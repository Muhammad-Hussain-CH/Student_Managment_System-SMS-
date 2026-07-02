import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CalendarCheck, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { ClassItem, PaginatedResponse } from '@/types';

interface AttendanceReport {
  records: number;
  summary: Array<{
    student: { _id: string; rollNo: string; user: { name: string } };
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    percentage: number;
  }>;
}

interface FeeReport {
  counts: { paid: number; pending: number; overdue: number; partial: number };
  collected: number;
  pending: number;
}

interface ResultsReport {
  total: number;
  gradeCounts: { A: number; B: number; C: number; D: number; F: number };
  avgPercentage: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'fees' | 'results'>('attendance');
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: classesData } = useQuery<PaginatedResponse<ClassItem>>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes?limit=50')).data,
  });

  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery<AttendanceReport>({
    queryKey: ['attendance-report', classId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      return (await api.get(`/dashboard/attendance-report?${params}`)).data.data;
    },
    enabled: activeTab === 'attendance',
  });

  const { data: feeReport, isLoading: feeLoading } = useQuery<FeeReport>({
    queryKey: ['fee-report'],
    queryFn: async () => (await api.get('/dashboard/fee-report')).data.data,
    enabled: activeTab === 'fees',
  });

  const { data: resultsReport, isLoading: resultsLoading } = useQuery<ResultsReport>({
    queryKey: ['results-report', classId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      return (await api.get(`/dashboard/results-report?${params}`)).data.data;
    },
    enabled: activeTab === 'results',
  });

  const classes = classesData?.data || [];

  const tabs = [
    { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { key: 'fees', label: 'Fee Collection', icon: DollarSign },
    { key: 'results', label: 'Results', icon: TrendingUp },
  ] as const;

  // PDF Export functions
  const exportAttendancePDF = () => {
    if (!attendanceReport?.summary?.length) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Attendance Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['Student', 'Roll No', 'Total', 'Present', 'Absent', 'Late', 'Leave', '%', 'Status']],
      body: attendanceReport.summary.map((s) => [
        s.student.user?.name || '',
        s.student.rollNo,
        s.total,
        s.present,
        s.absent,
        s.late,
        s.leave,
        `${s.percentage}%`,
        s.percentage >= 75 ? 'OK' : 'Shortage',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('attendance-report.pdf');
  };

  const exportFeesPDF = () => {
    if (!feeReport) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Fee Collection Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['Category', 'Count / Amount']],
      body: [
        ['Paid Records', feeReport.counts.paid],
        ['Pending Records', feeReport.counts.pending],
        ['Overdue Records', feeReport.counts.overdue],
        ['Partial Records', feeReport.counts.partial],
        ['Total Collected (PKR)', feeReport.collected.toLocaleString()],
        ['Total Pending (PKR)', feeReport.pending.toLocaleString()],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('fee-report.pdf');
  };

  const exportResultsPDF = () => {
    if (!resultsReport) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Results Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 23);
    doc.text(`Total Results: ${resultsReport.total} | Average: ${resultsReport.avgPercentage}%`, 14, 30);

    autoTable(doc, {
      startY: 35,
      head: [['Grade', 'Count']],
      body: Object.entries(resultsReport.gradeCounts).map(([grade, count]) => [
        `Grade ${grade}`, count,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('results-report.pdf');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and analyze institutional data.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
              <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.program} - {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {attendanceLoading ? (
            <div className="card p-8 text-center text-slate-400 text-sm">Loading report...</div>
          ) : !attendanceReport ? null : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">{attendanceReport.records} total records</p>
                <button
                  onClick={exportAttendancePDF}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 font-medium transition-all"
                >
                  ⬇ Download PDF
                </button>
              </div>
              {attendanceReport.summary.length === 0 ? (
                <div className="card p-8 text-center text-slate-400 text-sm">No records found for selected filters.</div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-100 bg-surface-50">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Student</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Total</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Present</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Absent</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Late</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">%</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {attendanceReport.summary.map((s) => (
                        <tr key={s.student._id} className="hover:bg-surface-50">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Avatar name={s.student.user?.name || 'S'} size="sm" />
                              <div>
                                <p className="font-medium text-slate-800 text-xs">{s.student.user?.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{s.student.rollNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600">{s.total}</td>
                          <td className="px-5 py-3.5 text-xs text-green-600 font-medium">{s.present}</td>
                          <td className="px-5 py-3.5 text-xs text-red-500 font-medium">{s.absent}</td>
                          <td className="px-5 py-3.5 text-xs text-amber-600 font-medium">{s.late}</td>
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{s.percentage}%</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={s.percentage >= 75 ? 'success' : 'danger'}>
                              {s.percentage >= 75 ? 'OK' : 'Shortage'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fee Report */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          {feeLoading ? (
            <div className="card p-8 text-center text-slate-400 text-sm">Loading report...</div>
          ) : !feeReport ? null : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={exportFeesPDF}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 font-medium transition-all"
                >
                  ⬇ Download PDF
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Paid', value: feeReport.counts.paid, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Pending', value: feeReport.counts.pending, color: 'text-slate-600', bg: 'bg-surface-50' },
                  { label: 'Overdue', value: feeReport.counts.overdue, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Partial', value: feeReport.counts.partial, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`card p-4 ${bg}`}>
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Collected</p>
                      <p className="text-xl font-bold text-green-600">PKR {feeReport.collected.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="card p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Pending</p>
                      <p className="text-xl font-bold text-red-500">PKR {feeReport.pending.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Results Report */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Class</label>
            <select className="input max-w-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.program} - {c.section}</option>
              ))}
            </select>
          </div>

          {resultsLoading ? (
            <div className="card p-8 text-center text-slate-400 text-sm">Loading report...</div>
          ) : !resultsReport ? null : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={exportResultsPDF}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 font-medium transition-all"
                >
                  ⬇ Download PDF
                </button>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">Grade Distribution</h3>
                  <span className="text-xs text-slate-500">{resultsReport.total} total results • Avg: {resultsReport.avgPercentage}%</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(resultsReport.gradeCounts).map(([grade, count]) => {
                    const colors: Record<string, string> = {
                      A: 'bg-green-100 text-green-700',
                      B: 'bg-blue-100 text-blue-700',
                      C: 'bg-amber-100 text-amber-700',
                      D: 'bg-orange-100 text-orange-700',
                      F: 'bg-red-100 text-red-700',
                    };
                    return (
                      <div key={grade} className={`rounded-xl p-4 text-center ${colors[grade]}`}>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs font-medium mt-1">Grade {grade}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}