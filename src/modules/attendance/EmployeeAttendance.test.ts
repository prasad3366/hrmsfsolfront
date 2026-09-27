import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import EmployeeAttendance, { getEmployeeAttendanceLocationLabel } from './EmployeeAttendance';

const mockRole = vi.hoisted(() => ({ value: 'HR' as string }));
const mockGetAttendanceEmployees = vi.hoisted(() => vi.fn());
const mockGetEmployeeAttendance = vi.hoisted(() => vi.fn());
const mockGetEmployeeAttendanceSummary = vi.hoisted(() => vi.fn());
const mockGetEmployee360Leave = vi.hoisted(() => vi.fn());
const mockAddMissedAttendance = vi.hoisted(() => vi.fn());

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole.value }),
}));

vi.mock('../../services/attendanceService', () => ({
  default: {
    getAttendanceEmployees: mockGetAttendanceEmployees,
  },
}));

vi.mock('../../services/api', () => ({
  default: {
    getEmployeeAttendance: mockGetEmployeeAttendance,
    getEmployeeAttendanceSummary: mockGetEmployeeAttendanceSummary,
    getEmployee360Leave: mockGetEmployee360Leave,
    addMissedAttendance: mockAddMissedAttendance,
  },
}));

const selectedEmployee = {
  id: 42,
  employeeId: 42,
  empCode: 'EMP-42',
  firstName: 'Jane',
  lastName: 'Doe',
  designation: 'Software Engineer',
};

const attendanceResponse = {
  data: [{
    id: 'attendance-1',
    employeeId: '42',
    date: '2025-05-15',
    status: 'PRESENT',
    punchIn: '2025-05-15T09:10:00',
    punchOut: '2025-05-15T17:42:00',
    totalHours: 8.53,
    locationLabel: 'In Office',
  }],
  meta: { totalPages: 1 },
};

const summaryResponse = {
  employeeId: 42,
  month: '2025-05',
  workingDays: 20,
  presentDays: 18,
  halfDays: 1,
  absentDays: 1,
  leaveDays: 0,
  attendancePercentage: 90,
};

const renderAttendanceWithEmployee = async (leaveHistory = { recentHistory: [] }, overrideAttendance = attendanceResponse) => {
  mockGetAttendanceEmployees.mockResolvedValue([selectedEmployee]);
  mockGetEmployeeAttendance.mockResolvedValue(overrideAttendance);
  mockGetEmployeeAttendanceSummary.mockResolvedValue(summaryResponse);
  mockGetEmployee360Leave.mockResolvedValue(leaveHistory);

  render(React.createElement(EmployeeAttendance));

  const user = userEvent.setup();
  const employeeButton = await screen.findByRole('button', { name: /Jane Doe/i });
  await user.click(employeeButton);

  await waitFor(() => {
    expect(screen.getAllByText(/Employee ID: EMP-42/i).length).toBeGreaterThan(0);
  });

  const monthInput = screen.getByLabelText(/Select attendance month/i) as HTMLInputElement;
  if (monthInput.value !== '2025-05') {
    fireEvent.change(monthInput, { target: { value: '2025-05' } });
  }
};

const findRowActionButton = (name: RegExp) => {
  const candidates = Array.from(document.querySelectorAll('button')).filter((button) => {
    const buttonText = (button.textContent || '').replace(/\s+/g, ' ').trim();
    return name.test(buttonText) && button.closest('td');
  });

  if (candidates.length === 0) {
    throw new Error(`No table action button matched ${name}`);
  }

  return candidates[0];
};

describe('Employee Attendance location display', () => {
  it.each([
    ['OFFICE', 'OFFICE', 'In Office'],
    ['OFFICE', 'OUTSIDE', 'Checked Out Outside Office'],
    ['OUTSIDE', 'OFFICE', 'Checked In Outside Office'],
    ['OUTSIDE', 'OUTSIDE', 'Out of Office'],
  ] as const)('maps %s + %s to %s', (punchIn, punchOut, expected) => {
    expect(getEmployeeAttendanceLocationLabel(punchIn, punchOut)).toBe(expected);
  });

  it.each([
    [undefined, undefined],
    ['OFFICE', undefined],
    [undefined, 'OFFICE'],
    ['WFH', 'OFFICE'],
    ['OFFICE', 'WFH'],
  ] as const)('maps incomplete location data to Unknown', (punchIn, punchOut) => {
    expect(getEmployeeAttendanceLocationLabel(punchIn, punchOut)).toBe('Unknown');
  });
});

describe('Employee Attendance Add Missed Attendance', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockGetAttendanceEmployees.mockReset();
    mockGetEmployeeAttendance.mockReset();
    mockGetEmployeeAttendanceSummary.mockReset();
    mockGetEmployee360Leave.mockReset();
    mockAddMissedAttendance.mockReset();
    mockRole.value = 'HR';
  });

  it.each(['HR', 'SUPER_ADMIN', 'CEO'] as const)('shows Add missed attendance for %s', async (role) => {
    mockRole.value = role;
    mockGetAttendanceEmployees.mockResolvedValue([selectedEmployee]);
    mockGetEmployeeAttendance.mockResolvedValue(attendanceResponse);
    mockGetEmployeeAttendanceSummary.mockResolvedValue(summaryResponse);
    mockGetEmployee360Leave.mockResolvedValue({ recentHistory: [] });

    render(React.createElement(EmployeeAttendance));

    const user = userEvent.setup();
    const employeeButton = await screen.findByRole('button', { name: /Jane Doe/i });
    await user.click(employeeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add missed attendance/i })).toBeTruthy();
    });
  });

  it.each(['EMPLOYEE', 'IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER'] as const)('hides Add missed attendance for %s', async (role) => {
    mockRole.value = role;
    mockGetAttendanceEmployees.mockResolvedValue([selectedEmployee]);
    mockGetEmployeeAttendance.mockResolvedValue(attendanceResponse);
    mockGetEmployeeAttendanceSummary.mockResolvedValue(summaryResponse);
    mockGetEmployee360Leave.mockResolvedValue({ recentHistory: [] });

    render(React.createElement(EmployeeAttendance));

    const user = userEvent.setup();
    const employeeButton = await screen.findByRole('button', { name: /Jane Doe/i });
    await user.click(employeeButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Add missed attendance/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Add missed checkout/i })).toBeNull();
    });
  });

  it.each(['HR', 'SUPER_ADMIN', 'CEO'] as const)('shows eligible missed-attendance row actions for %s', async (role) => {
    mockRole.value = role;
    mockGetEmployeeAttendance.mockResolvedValue({
      data: [
        { ...attendanceResponse.data[0], id: 'attendance-absent', date: '2025-05-17', status: 'ABSENT', punchIn: null, punchOut: null, totalHours: 0 },
        { ...attendanceResponse.data[0], id: 'attendance-in-progress', date: '2025-05-18', status: 'IN_PROGRESS', punchIn: '2025-05-18T09:15:00', punchOut: null, totalHours: null },
      ],
      meta: { totalPages: 1 },
    });

    await renderAttendanceWithEmployee({ recentHistory: [] }, {
      data: [
        { ...attendanceResponse.data[0], id: 'attendance-absent', date: '2025-05-17', status: 'ABSENT', punchIn: null, punchOut: null, totalHours: 0 },
        { ...attendanceResponse.data[0], id: 'attendance-in-progress', date: '2025-05-18', status: 'IN_PROGRESS', punchIn: '2025-05-18T09:15:00', punchOut: null, totalHours: null },
      ],
      meta: { totalPages: 1 },
    });

    await waitFor(() => {
      expect(findRowActionButton(/Add missed attendance/i)).toBeTruthy();
      expect(findRowActionButton(/Add missed checkout/i)).toBeTruthy();
    });
  });

  it('opens the correction form from an absent row action', async () => {
    await renderAttendanceWithEmployee({ recentHistory: [] }, {
      data: [{
        id: 'attendance-absent-row',
        employeeId: '42',
        date: '2025-05-17',
        status: 'ABSENT',
        punchIn: null,
        punchOut: null,
        totalHours: 0,
        locationLabel: 'Unknown',
      }],
      meta: { totalPages: 1 },
    });

    const user = userEvent.setup();
    await waitFor(() => {
      expect(findRowActionButton(/Add missed attendance/i)).toBeTruthy();
    });
    await user.click(findRowActionButton(/Add missed attendance/i));

    await waitFor(() => {
      expect((screen.getByLabelText(/Date/i) as HTMLInputElement).value).toBe('2025-05-17');
      expect(screen.getByPlaceholderText(/Enter a reason for the correction/i)).toBeTruthy();
    });
  });

  it('opens the missed-checkout form from an incomplete row action', async () => {
    await renderAttendanceWithEmployee({ recentHistory: [] }, {
      data: [{
        id: 'attendance-in-progress-row',
        employeeId: '42',
        date: '2025-05-18',
        status: 'IN_PROGRESS',
        punchIn: '2025-05-18T09:15:00',
        punchOut: null,
        totalHours: null,
        locationLabel: 'Unknown',
      }],
      meta: { totalPages: 1 },
    });

    const user = userEvent.setup();
    await waitFor(() => {
      expect(findRowActionButton(/Add missed checkout/i)).toBeTruthy();
    });
    await user.click(findRowActionButton(/Add missed checkout/i));

    await waitFor(() => {
      expect((screen.getByLabelText(/Date/i) as HTMLInputElement).value).toBe('2025-05-18');
      expect((screen.getByLabelText(/Clock in/i) as HTMLInputElement).value).toBe('09:15');
    });
  });

  it('shows inline validation when the reason is empty or whitespace and blocks submission', async () => {
    await renderAttendanceWithEmployee();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add missed attendance/i }));

    const reasonInput = screen.getByPlaceholderText(/Enter a reason for the correction/i);

    await user.click(screen.getByRole('button', { name: /Save attendance/i }));

    await waitFor(() => {
      expect(screen.getByText(/Correction reason is required\./i)).toBeTruthy();
    });
    expect((reasonInput as HTMLInputElement).getAttribute('aria-invalid')).toBe('true');
    expect(mockAddMissedAttendance).not.toHaveBeenCalled();

    await user.clear(reasonInput);
    await user.type(reasonInput, '   ');
    await user.click(screen.getByRole('button', { name: /Save attendance/i }));

    await waitFor(() => {
      expect(screen.getByText(/Correction reason is required\./i)).toBeTruthy();
    });
    expect(mockAddMissedAttendance).not.toHaveBeenCalled();
  });

  it('prefills the correction form from the existing attendance record and keeps the attendance UI visible', async () => {
    await renderAttendanceWithEmployee();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add missed attendance/i }));

    const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-05-15' } });

    await waitFor(() => {
      expect((screen.getByLabelText(/Clock in/i) as HTMLInputElement).value).toBe('09:10');
      expect((screen.getByLabelText(/Clock out/i) as HTMLInputElement).value).toBe('17:42');
    });

    expect(screen.getByText('Attendance Summary')).toBeTruthy();
    expect(screen.getByText('Attendance Details')).toBeTruthy();
  });

  it('submits missed attendance through the existing API and refreshes attendance records', async () => {
    mockAddMissedAttendance.mockResolvedValue({ record: {}, message: 'Missed attendance added successfully.' });
    await renderAttendanceWithEmployee();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add missed attendance/i }));

    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2025-05-15' } });
    fireEvent.change(screen.getByLabelText(/Clock in/i), { target: { value: '08:30' } });
    fireEvent.change(screen.getByLabelText(/Clock out/i), { target: { value: '17:45' } });
    await user.type(screen.getByPlaceholderText(/Enter a reason for the correction/i), 'Worked on a client support issue');
    await user.click(screen.getByRole('button', { name: /Save attendance/i }));

    await waitFor(() => {
      expect(mockAddMissedAttendance).toHaveBeenCalledWith(42, expect.objectContaining({
        date: '2025-05-15',
        clockIn: '2025-05-15T08:30:00',
        clockOut: '2025-05-15T17:45:00',
        reason: 'Worked on a client support issue',
      }));
    });

    await waitFor(() => {
      expect(mockGetEmployeeAttendance.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('normalizes ISO attendance dates before submitting missed attendance', async () => {
    mockAddMissedAttendance.mockResolvedValue({ record: {}, message: 'Missed attendance added successfully.' });
    const isoDate = new Date().toISOString();
    const dateOnly = isoDate.slice(0, 10);
    await renderAttendanceWithEmployee({ recentHistory: [] }, {
      data: [{
        ...attendanceResponse.data[0],
        id: 'attendance-iso-date',
        date: isoDate,
        status: 'ABSENT',
        punchIn: null,
        punchOut: null,
      }],
      meta: { totalPages: 1 },
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add missed attendance/i }));
    await user.type(screen.getByPlaceholderText(/Enter a reason for the correction/i), 'Manual correction');
    await user.click(screen.getByRole('button', { name: /Save attendance/i }));

    await waitFor(() => {
      expect(mockAddMissedAttendance).toHaveBeenCalledWith(42, expect.objectContaining({
        date: dateOnly,
        clockIn: `${dateOnly}T09:00:00`,
        clockOut: `${dateOnly}T17:00:00`,
      }));
    });
  });

  it('prevents duplicate submissions while a request is in progress', async () => {
    let resolveSubmit: ((value: any) => void) | undefined;
    mockAddMissedAttendance.mockReturnValue(new Promise((resolve) => {
      resolveSubmit = resolve;
    }));

    await renderAttendanceWithEmployee();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add missed attendance/i }));

    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2025-05-15' } });
    fireEvent.change(screen.getByLabelText(/Clock in/i), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/Clock out/i), { target: { value: '18:00' } });
    await user.type(screen.getByPlaceholderText(/Enter a reason for the correction/i), 'Manual correction');

    const saveButton = screen.getByRole('button', { name: /Save attendance/i });
    await user.click(saveButton);
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAddMissedAttendance).toHaveBeenCalledTimes(1);
    });

    resolveSubmit?.({ record: {}, message: 'Missed attendance added successfully.' });
  });

  it('blocks approved leave dates from the correction UI', async () => {
    await renderAttendanceWithEmployee({
      recentHistory: [{
        id: 'leave-1',
        leaveType: 'Casual Leave',
        startDate: '2025-05-15',
        endDate: '2025-05-15',
        totalDays: 1,
        durationType: 'FULL_DAY',
        status: 'APPROVED',
      }],
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add missed attendance/i }));

    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2025-05-15' } });
    fireEvent.change(screen.getByLabelText(/Clock in/i), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/Clock out/i), { target: { value: '17:00' } });
    await user.type(screen.getByPlaceholderText(/Enter a reason for the correction/i), 'Correcting manual entry');
    await user.click(screen.getByRole('button', { name: /Save attendance/i }));

    await waitFor(() => {
      expect(screen.getByText(/Approved leave dates cannot be submitted as missed attendance/i)).toBeTruthy();
    });
    expect(mockAddMissedAttendance).not.toHaveBeenCalled();
  });
});
