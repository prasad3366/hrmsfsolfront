import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import RichDashboard from './RichDashboard';

const api = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  getMyAttendance: vi.fn(),
  getMyHolidays: vi.fn(),
  getMyAssets: vi.fn(),
  getHelpdeskTickets: vi.fn(),
  getAttendanceEmployees: vi.fn(),
  getAttendance: vi.fn(),
  getPayroll: vi.fn(),
  getEmployeeAttendance: vi.fn(),
  exportAttendance: vi.fn(),
}));
const navigate = vi.hoisted(() => vi.fn());

vi.mock('../../services/api', () => ({ default: api }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../hooks/useAttendance', () => ({
  useAttendance: () => ({ todayRecord: undefined, todayError: null, isLoading: false, punchIn: vi.fn(), punchOut: vi.fn() }),
  getTodayAttendanceState: () => 'NOT_CHECKED_IN',
  getAttendanceLocationLabel: () => 'In Office',
}));
vi.mock('../../hooks/useGeolocation', () => ({ useGeolocation: () => ({ requestLocation: vi.fn(), isLoading: false, error: null }) }));
vi.mock('../../hooks/useHolidays', () => ({ useHolidays: () => ({ createHoliday: vi.fn(), isSubmitting: false }) }));
vi.mock('../../components/employees/CreateEmployeeModal', () => ({ CreateEmployeeModal: () => null }));
vi.mock('../../components/holidays/CreateHolidayModal', () => ({ default: () => null }));
vi.mock('../../components/payroll/RunPayrollModal', () => ({ RunPayrollModal: ({ isOpen }: any) => (isOpen ? <div>Run payroll dialog</div> : null) }));
vi.mock('../../components/payroll/AssignSalaryModal', () => ({ AssignSalaryModal: ({ isOpen }: any) => (isOpen ? <div>Assign salary dialog</div> : null) }));

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any;
});

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  api.getMyAttendance.mockResolvedValue({ data: [] });
  api.getMyHolidays.mockResolvedValue([]);
  api.getMyAssets.mockResolvedValue([]);
  api.getHelpdeskTickets.mockResolvedValue([]);
  api.getAttendanceEmployees.mockResolvedValue({ data: [] });
  api.getAttendance.mockResolvedValue([]);
  api.getPayroll.mockResolvedValue([]);
  api.getEmployeeAttendance.mockResolvedValue({ data: [] });
});

const localDateKey = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const orgDashboard = (role: string, extra: Record<string, unknown> = {}) => ({
  role,
  scope: { employeeCount: 10 },
  kpis: {
    totalEmployees: 10, activeEmployees: 9, presentToday: 6, lateToday: 1, halfDayToday: 1, onLeaveToday: 1, absentToday: 2,
    pendingLeaveRequests: 2, pendingWfhRequests: 0, pendingAttendanceRegularizations: 1,
  },
  workforce: {
    present: 6, late: 1, halfDay: 1, leave: 1, absent: 2,
    byEmployee: [{ employeeId: 21, department: 'Sales', status: 'PRESENT' }, { employeeId: 22, department: 'Sales', status: 'ABSENT' }],
  },
  departmentSummary: [
    { department: 'Engineering', employeeCount: 6, presentToday: 4, leaveToday: 1, absentToday: 1 },
    { department: 'Sales', employeeCount: 4, presentToday: 2, leaveToday: 0, absentToday: 1 },
  ],
  pendingActions: {
    leave: [
      { id: 1, employee: { firstName: 'Ravi', lastName: 'K' }, leaveType: { name: 'Casual Leave' }, totalDays: 1 },
      { id: 2, employee: { firstName: 'Anu', lastName: 'P' }, leaveType: { name: 'Sick Leave' }, totalDays: 2 },
    ],
    wfh: [],
    attendanceRegularizations: 1,
  },
  ...extra,
});

const quickActionLabels = async () => {
  const section = (await screen.findByText('Quick actions')).closest('section') as HTMLElement;
  return within(section).getAllByRole('button').map((button) => button.textContent?.trim());
};

describe('RichDashboard role-based presentation', () => {
  it('EMPLOYEE: header, check-in action, real KPIs, no DRAFT payslip, employee actions', async () => {
    api.getDashboard.mockResolvedValue({
      role: 'EMPLOYEE',
      employee: { firstName: 'Asha', lastName: 'Rao', department: 'Engineering' },
      today: { status: null },
      month: { presentDays: 12, halfDays: 1, leaveDays: 2, absentDays: 3 },
      leaveBalance: [{ leaveType: 'Casual Leave', allocated: 2, used: 1, remaining: 1 }],
      pendingLeaveRequests: 1,
      payroll: { month: 10, year: 2026, status: 'DRAFT' },
      wfh: [],
    });
    render(<RichDashboard role="EMPLOYEE" />);

    expect(await screen.findByText('Welcome, Asha Rao')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Check In' })).toBeTruthy();
    // Present days appear in the KPI card and in the month donut legend
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('None yet')).toBeTruthy();
    expect(screen.queryByText('Oct 2026')).toBeNull();
    expect(await quickActionLabels()).toEqual(['View payslips', 'My attendance', 'Request leave', 'Request work from home', 'View performance']);
    expect(api.getAttendance).not.toHaveBeenCalled();
    expect(api.getAttendanceEmployees).not.toHaveBeenCalled();
    expect(api.getEmployeeAttendance).not.toHaveBeenCalled();
    expect(api.getPayroll).not.toHaveBeenCalled();
  });

  it('EMPLOYEE: a finalized payslip is shown with its period', async () => {
    api.getDashboard.mockResolvedValue({
      role: 'EMPLOYEE', employee: { firstName: 'Asha', lastName: 'Rao' }, month: {}, leaveBalance: [], payroll: { month: 9, year: 2026, status: 'FINALIZED' }, wfh: [],
    });
    render(<RichDashboard role="EMPLOYEE" />);

    expect(await screen.findByText('Sep 2026')).toBeTruthy();
    expect(screen.getByText('Ready to download')).toBeTruthy();
  });

  it('HR: workforce KPIs, attention items, authorized quick actions and Today/Yesterday attendance', async () => {
    api.getDashboard.mockResolvedValue(orgDashboard('HR', { hr: { newJoiners: 3, noticePeriod: 1, probation: 2 } }));
    render(<RichDashboard role="HR" userName="Priya" />);

    expect(await screen.findByText('Welcome, Priya')).toBeTruthy();
    expect(screen.getByText('New joiners')).toBeTruthy();
    expect(screen.getByText('Pending leave requests', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText('Attendance regularizations')).toBeTruthy();
    expect(screen.queryByText('Pending WFH requests', { selector: 'span' })).toBeNull();

    const labels = await quickActionLabels();
    expect(labels).toEqual(expect.arrayContaining(['Add employee', 'Generate payroll', 'Salary management', 'Payroll', 'Manage employees', 'Attendance', 'Leave', 'Teams', 'Reports']));

    fireEvent.click(screen.getByRole('button', { name: 'Generate payroll' }));
    expect(screen.getByText('Run payroll dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Salary management' }));
    expect(screen.getByText('Assign salary dialog')).toBeTruthy();

    // One request per day for the 7-day window; the trend and the Today/Yesterday table share it
    await waitFor(() => expect(api.getAttendance).toHaveBeenCalledTimes(7));
    expect(api.getAttendance).toHaveBeenCalledWith(localDateKey(0));
    expect(api.getAttendance).toHaveBeenCalledWith(localDateKey(-1));
    expect(api.getPayroll).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Yesterday' }));
    expect(screen.getByRole('button', { name: 'Yesterday' }).getAttribute('aria-pressed')).toBe('true');
    expect(api.getAttendance).toHaveBeenCalledTimes(7);

    // Navigating beyond the cached window loads that day only
    for (let step = 0; step < 6; step += 1) fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    await waitFor(() => expect(api.getAttendance).toHaveBeenCalledWith(localDateKey(-7)));
    expect(api.getAttendance).toHaveBeenCalledTimes(8);
  });

  it('SALES_MANAGER: team scope, team attendance table, no org-only data or actions', async () => {
    api.getDashboard.mockResolvedValue(orgDashboard('SALES_MANAGER'));
    api.getAttendanceEmployees.mockResolvedValue({ data: [{ id: 21, firstName: 'Kiran', lastName: 'S' }, { id: 22, firstName: 'Meena', lastName: 'T' }] });
    render(<RichDashboard role="SALES_MANAGER" userName="Arjun" />);

    expect(await screen.findByText('Team members')).toBeTruthy();
    const table = (await screen.findByText('Team attendance today')).closest('section') as HTMLElement;
    expect(await within(table).findByText('Kiran S')).toBeTruthy();
    expect(within(table).getByText('Meena T')).toBeTruthy();

    const labels = await quickActionLabels();
    expect(labels).not.toContain('Add employee');
    expect(labels).not.toContain('Generate payroll');
    expect(labels).not.toContain('Salary management');
    expect(labels).toEqual(expect.arrayContaining(['Employees', 'Attendance', 'Leave', 'WFH requests', 'Teams', 'Reports', 'Export attendance']));
    expect(api.getAttendance).not.toHaveBeenCalled();
    expect(api.getHelpdeskTickets).not.toHaveBeenCalled();
    expect(api.getPayroll).not.toHaveBeenCalled();
    // Team trend and previous-day view come from each authorized member's monthly records
    await waitFor(() => expect(api.getEmployeeAttendance).toHaveBeenCalledWith(21, expect.any(Number), expect.any(Number), undefined, 1, 31));
    expect(api.getEmployeeAttendance).toHaveBeenCalledWith(22, expect.any(Number), expect.any(Number), undefined, 1, 31);

    fireEvent.click(within(table).getByRole('button', { name: 'Yesterday' }));
    expect(await screen.findByText('Team attendance yesterday')).toBeTruthy();
  });

  it('FINANCE_MANAGER: payroll status and totals from persisted payroll data', async () => {
    api.getDashboard.mockResolvedValue({
      role: 'FINANCE_MANAGER',
      kpis: { activeEmployees: 9, payrollEmployeePopulation: 8, draftPayrolls: 2, finalizedPayrolls: 5, paidPayrolls: 1, pendingLeaveRequests: 0 },
      payroll: { grossTotal: 500000, netTotal: 450000, lopDays: 3 },
      pendingActions: { leave: [] },
    });
    render(<RichDashboard role="FINANCE_MANAGER" userName="Neha" />);

    expect(await screen.findByText('Payroll status')).toBeTruthy();
    expect(screen.getByText('₹5,00,000')).toBeTruthy();
    expect(screen.getByText('₹4,50,000')).toBeTruthy();
    expect(screen.getByText('No pending approvals right now.')).toBeTruthy();
    expect(await quickActionLabels()).not.toContain('Add employee');
  });

  it('keeps the existing loading and error states', async () => {
    api.getDashboard.mockReturnValue(new Promise(() => undefined));
    render(<RichDashboard role="HR" />);
    expect(screen.getByRole('status').textContent).toContain('Loading your live dashboard');
    cleanup();

    api.getDashboard.mockRejectedValue(new Error('Dashboard unavailable'));
    render(<RichDashboard role="HR" />);
    expect((await screen.findByRole('alert')).textContent).toContain('Dashboard unavailable');
  });
});
