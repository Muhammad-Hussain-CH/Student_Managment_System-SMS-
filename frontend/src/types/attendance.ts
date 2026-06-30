export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  _id: string;
  student: { _id: string; rollNo: string; user: { name: string; email: string; avatar?: { url: string | null } } };
  subject: string;
  class: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
  belowThreshold: boolean;
}