export type Role = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department: string;
  designation: string;
  employeeId?: number; // Backend employee record ID
}

export interface Employee extends User {
  joinDate: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  managerId?: string;
  salary: number;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave';
  totalHours: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'Sick' | 'Casual' | 'Earned' | 'Maternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'Processed' | 'Pending';
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string; // e.g., "+12%"
  trend?: 'up' | 'down' | 'neutral';
  icon?: any;
}