export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar: { public_id: string | null; url: string | null };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface StudentProfile {
  _id: string;
  user: User;
  rollNo: string;
  program: string;
  class?: { _id: string; name: string; section: string };
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  cnic?: string;
  contact?: { phone?: string; address?: string; city?: string };
  guardian?: { name?: string; relation?: string; phone?: string };
  photo?: { public_id: string | null; url: string | null };
  batch?: string;
  isActive: boolean;
  createdAt: string;
}
export interface ClassItem {
  _id: string;
  name: string;
  section: string;
  program: string;
  semester?: number;
  classTeacher?: { _id: string; user: { name: string; email: string } } | null;
  isActive: boolean;
  createdAt: string;
}

export interface SubjectItem {
  _id: string;
  name: string;
  code: string;
  creditHours: number;
  classes: Array<{ _id: string; name: string; section: string; program: string }>;
  teacher?: { _id: string; user: { name: string; email: string }; employeeId: string } | null;
  isActive: boolean;
  createdAt: string;
}

export interface TeacherItem {
  _id: string;
  user: { _id: string; name: string; email: string };
  employeeId: string;
  qualification?: string;
  department?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
