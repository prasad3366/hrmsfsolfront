import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from './types';

// Mock Users/Employees
export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Alexandra Admin',
    email: 'admin@foodeez.com',
    role: 'ADMIN',
    avatar: 'https://picsum.photos/200/200?random=1',
    department: 'Management',
    designation: 'Chief Operations Officer',
    joinDate: '2020-01-15',
    phone: '+1 555-0101',
    status: 'Active',
    salary: 120000
  },
  {
    id: '2',
    name: 'Hector HR',
    email: 'hr@foodeez.com',
    role: 'HR',
    avatar: 'https://picsum.photos/200/200?random=2',
    department: 'Human Resources',
    designation: 'HR Manager',
    joinDate: '2021-03-10',
    phone: '+1 555-0102',
    status: 'Active',
    salary: 85000
  },
  {
    id: '3',
    name: 'Michael Manager',
    email: 'manager@foodeez.com',
    role: 'MANAGER',
    avatar: 'https://picsum.photos/200/200?random=3',
    department: 'Engineering',
    designation: 'Engineering Manager',
    joinDate: '2019-11-01',
    phone: '+1 555-0103',
    status: 'Active',
    salary: 110000
  },
  {
    id: '4',
    name: 'Emma Employee',
    email: 'user@foodeez.com',
    role: 'EMPLOYEE',
    avatar: 'https://picsum.photos/200/200?random=4',
    department: 'Engineering',
    designation: 'Senior Frontend Engineer',
    joinDate: '2022-06-15',
    phone: '+1 555-0104',
    status: 'Active',
    managerId: '3',
    salary: 95000
  },
  {
    id: '5',
    name: 'Sarah Smith',
    email: 'sarah@foodeez.com',
    role: 'EMPLOYEE',
    avatar: 'https://picsum.photos/200/200?random=5',
    department: 'Marketing',
    designation: 'Content Strategist',
    joinDate: '2023-01-20',
    phone: '+1 555-0105',
    status: 'On Leave',
    managerId: '1',
    salary: 75000
  },
];

// Mock Attendance (Last 7 days for Emma)
export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', employeeId: '4', date: '2023-10-20', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present', totalHours: 9 },
  { id: 'a2', employeeId: '4', date: '2023-10-21', checkIn: '09:15 AM', checkOut: '06:10 PM', status: 'Present', totalHours: 8.9 },
  { id: 'a3', employeeId: '4', date: '2023-10-22', checkIn: '08:55 AM', checkOut: '05:55 PM', status: 'Present', totalHours: 9 },
  { id: 'a4', employeeId: '4', date: '2023-10-23', checkIn: null, checkOut: null, status: 'Absent', totalHours: 0 },
  { id: 'a5', employeeId: '4', date: '2023-10-24', checkIn: '09:30 AM', checkOut: '06:30 PM', status: 'Present', totalHours: 9 },
];

// Mock Leaves
export const MOCK_LEAVES: LeaveRequest[] = [
  { id: 'l1', employeeId: '4', type: 'Sick Leave', startDate: '2023-10-23', endDate: '2023-10-23', reason: 'Viral Fever', status: 'Approved' },
  { id: 'l2', employeeId: '4', type: 'Casual Leave', startDate: '2023-11-10', endDate: '2023-11-12', reason: 'Family function', status: 'Pending' },
  { id: 'l3', employeeId: '5', type: 'Maternity Leave', startDate: '2023-12-01', endDate: '2023-12-10', reason: 'Maternity', status: 'Approved' },
];

// Mock Payroll
export const MOCK_PAYROLL: PayrollRecord[] = [
  { id: 'p1', employeeId: '4', month: 'September', year: 2023, basic: 45000, hra: 20000, allowances: 10000, deductions: 5000, netPay: 70000, status: 'Processed' },
  { id: 'p2', employeeId: '4', month: 'August', year: 2023, basic: 45000, hra: 20000, allowances: 10000, deductions: 5000, netPay: 70000, status: 'Processed' },
];