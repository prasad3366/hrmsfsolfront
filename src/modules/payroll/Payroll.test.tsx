import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Payroll from './Payroll';

const testState = vi.hoisted(() => ({
  role: 'HR',
  getPayroll: vi.fn(),
  getMyPayroll: vi.fn(),
  getMyEmployeeDetails: vi.fn(),
  recalculatePayroll: vi.fn(),
  downloadPayslip: vi.fn(),
  finalizePayroll: vi.fn(),
  previewPayrollRecalculation: vi.fn(),
  reopenPayroll: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { employeeId: 7, role: testState.role } }),
}));

vi.mock('../../services/api', () => ({
  default: {
    getPayroll: testState.getPayroll,
    getMyPayroll: testState.getMyPayroll,
    getMyEmployeeDetails: testState.getMyEmployeeDetails,
    recalculatePayroll: testState.recalculatePayroll,
    downloadPayslip: testState.downloadPayslip,
    finalizePayroll: testState.finalizePayroll,
    previewPayrollRecalculation: testState.previewPayrollRecalculation,
    reopenPayroll: testState.reopenPayroll,
  },
}));

vi.mock('../../components/payroll/RunPayrollModal', () => ({ RunPayrollModal: () => null }));
vi.mock('../../components/payroll/AssignSalaryModal', () => ({ AssignSalaryModal: () => null }));
vi.mock('../../components/payroll/AddPayrollAdjustmentModal', () => ({ AddPayrollAdjustmentModal: () => null }));

vi.mock('../../components/ui/components', async () => {
  const ReactModule = await import('react');
  const renderChildren = (tag: string) => ({ children, ...props }: any) =>
    ReactModule.createElement(tag, props, children);

  return {
    Button: renderChildren('button'),
    Card: renderChildren('section'),
    CardHeader: renderChildren('div'),
    CardTitle: renderChildren('h2'),
    CardContent: renderChildren('div'),
    EmptyState: renderChildren('div'),
    ErrorState: ({ message }: any) => ReactModule.createElement('div', { role: 'alert' }, message),
    PageHeader: ({ title, actions }: any) => ReactModule.createElement(
      'header',
      null,
      ReactModule.createElement('h1', null, title),
      actions,
    ),
    Skeleton: renderChildren('div'),
    ModalPortal: ({ children }: any) => ReactModule.createElement(ReactModule.Fragment, null, children),
    StatCard: () => null,
    DataTable: ({ columns, data, getRowKey }: any) => ReactModule.createElement(
      'table',
      null,
      ReactModule.createElement('tbody', null, data.map((row: any) => ReactModule.createElement(
        'tr',
        { key: getRowKey(row) },
        columns.map((column: any) => ReactModule.createElement(
          'td',
          { key: column.key },
          column.render ? column.render(row) : row[column.key],
        )),
      ))),
    ),
  };
});

const initialPayroll = {
  id: 3,
  employeeId: 7,
  salaryId: 2,
  month: 9,
  year: 2026,
  workingDays: 21,
  presentDays: 15,
  lopDays: 6,
  basic: 30000,
  hra: 12000,
  conveyance: 6000,
  specialAllowance: 12000,
  pf: 3600,
  pt: 200,
  leaveDeduction: 17143,
  grossSalary: 60000,
  deductions: 20943,
  netSalary: 39057,
  status: 'DRAFT' as const,
  employee: { id: 7, empCode: 'EMP007', firstName: 'Ada', lastName: 'Employee' },
};

const otherEmployeePayroll = {
  ...initialPayroll,
  id: 4,
  employeeId: 8,
  employee: { id: 8, empCode: 'EMP008', firstName: 'Grace', lastName: 'Hopper' },
};

const finalizedPayroll = {
  ...initialPayroll,
  id: 5,
  employeeId: 9,
  status: 'FINALIZED' as const,
  employee: { id: 9, empCode: 'EMP009', firstName: 'Linus', lastName: 'Torvalds' },
};

const paidPayroll = {
  ...initialPayroll,
  id: 6,
  employeeId: 10,
  status: 'PAID' as const,
  employee: { id: 10, empCode: 'EMP010', firstName: 'Katherine', lastName: 'Johnson' },
};

const correctedPayroll = {
  ...otherEmployeePayroll,
  presentDays: 21,
  lopDays: 0,
  leaveDeduction: 0,
  deductions: 3800,
  netSalary: 56200,
};

let payrollFetchCount = 0;

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  payrollFetchCount = 0;
  testState.role = 'HR';
  testState.getPayroll.mockImplementation(async () => {
    payrollFetchCount += 1;
    return payrollFetchCount === 1
      ? [initialPayroll, otherEmployeePayroll, finalizedPayroll, paidPayroll]
      : [initialPayroll, correctedPayroll, finalizedPayroll, paidPayroll];
  });
  testState.getMyPayroll.mockResolvedValue([initialPayroll]);
  testState.getMyEmployeeDetails.mockResolvedValue({ salaries: [] });
  testState.recalculatePayroll.mockResolvedValue(correctedPayroll);
});

describe('Payroll recalculation action', () => {
  it.each(['HR', 'SUPER_ADMIN', 'CEO'])('loads organization payroll for %s', async (role) => {
    testState.role = role;
    render(<Payroll />);

    expect(await screen.findByText('Grace Hopper')).toBeTruthy();
    expect(screen.getByText('EMP008')).toBeTruthy();
    expect(testState.getPayroll).toHaveBeenCalledWith();
    expect(testState.getMyPayroll).not.toHaveBeenCalled();
    expect(screen.getByText('FINALIZED')).toBeTruthy();
    expect(screen.getByText('PAID')).toBeTruthy();
  });

  it.each(['EMPLOYEE', 'FINANCE_MANAGER', 'IT_MANAGER', 'SALES_MANAGER'])(
    'hides the recalculation action from %s',
    async (role) => {
      testState.role = role;
      render(<Payroll />);

      await waitFor(() => expect(testState.getMyPayroll).toHaveBeenCalled());
      expect(testState.getPayroll).not.toHaveBeenCalled();
      expect(screen.queryByText('Grace Hopper')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Recalculate' })).toBeNull();
    },
  );

  it('hides recalculation for a finalized payroll', async () => {
    testState.getPayroll.mockResolvedValue([finalizedPayroll]);
    render(<Payroll />);

    await waitFor(() => expect(testState.getPayroll).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Recalculate' })).toBeNull();
  });

  it('recalculates another employee payroll and displays refreshed values', async () => {
    render(<Payroll />);
    const otherEmployeeRow = (await screen.findByText('Grace Hopper')).closest('tr');
    expect(otherEmployeeRow).not.toBeNull();
    fireEvent.click(within(otherEmployeeRow as HTMLElement).getByRole('button', { name: 'Recalculate' }));

    await waitFor(() => expect(testState.recalculatePayroll).toHaveBeenCalledWith(4));
    await waitFor(() => expect(testState.getPayroll).toHaveBeenCalledTimes(2));

    const payrollRow = screen.getByText('Grace Hopper').closest('tr') as HTMLElement;
    expect(payrollRow.textContent).toContain('21');
    expect(payrollRow.textContent).toContain('0');
    expect(payrollRow.textContent).toContain('₹56,200');
  });
});

describe('Employee payroll history', () => {
  const finalizedWithPeriod = {
    ...finalizedPayroll,
    employeeId: 7,
    period: { startDate: '2026-08-29', endDate: '2026-09-28' },
  };

  it('shows the authoritative payroll period dates instead of month/year', async () => {
    testState.role = 'EMPLOYEE';
    testState.getMyPayroll.mockResolvedValue([finalizedWithPeriod]);
    render(<Payroll />);

    expect((await screen.findAllByText('29 Aug 2026 – 28 Sep 2026')).length).toBeGreaterThan(0);
    expect(screen.queryByText('9/2026')).toBeNull();
  });

  it('falls back to month/year when period dates are unavailable', async () => {
    testState.role = 'EMPLOYEE';
    testState.getMyPayroll.mockResolvedValue([{ ...finalizedPayroll, employeeId: 7 }]);
    render(<Payroll />);

    expect((await screen.findAllByText('9/2026')).length).toBeGreaterThan(0);
  });

  it('does not show adjustment actions to an EMPLOYEE but keeps the payslip download', async () => {
    testState.role = 'EMPLOYEE';
    testState.getMyPayroll.mockResolvedValue([finalizedWithPeriod]);
    render(<Payroll />);

    await waitFor(() => expect(testState.getMyPayroll).toHaveBeenCalled());
    await screen.findAllByText('29 Aug 2026 – 28 Sep 2026');
    expect(screen.queryByRole('button', { name: '+ Adjust' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Add Adjustment/ })).toBeNull();
    const download = screen.getByRole('button', { name: 'Download payslip' }) as HTMLButtonElement;
    expect(download.disabled).toBe(false);
    fireEvent.click(download);
    await waitFor(() => expect(testState.downloadPayslip).toHaveBeenCalledWith(5));
  });

  it.each(['HR', 'SUPER_ADMIN', 'CEO'])('keeps adjustment actions for %s', async (role) => {
    testState.role = role;
    testState.getPayroll.mockResolvedValue([otherEmployeePayroll]);
    render(<Payroll />);

    const row = (await screen.findByText('Grace Hopper')).closest('tr') as HTMLElement;
    expect(within(row).getByRole('button', { name: '+ Adjust' })).toBeTruthy();
  });

  it('shows a load error instead of an empty history when the API fails', async () => {
    testState.role = 'EMPLOYEE';
    testState.getMyPayroll.mockRejectedValue(new Error('Unable to load payroll history. Please try again.'));
    render(<Payroll />);

    expect(await screen.findByText('Unable to load payroll history. Please try again.')).toBeTruthy();
    expect(screen.queryByText('No payroll records')).toBeNull();
  });
});

describe('Payroll correction workflow', () => {
  const stalePayroll = { ...otherEmployeePayroll, needsRecalculation: true };
  const revisedPayroll = { ...finalizedPayroll, revision: 2 };
  const rowFor = async (name: string) => (await screen.findByText(name)).closest('tr') as HTMLElement;

  it('shows a stale badge and blocks finalize and download while recalculation is needed', async () => {
    testState.getPayroll.mockResolvedValue([stalePayroll]);
    render(<Payroll />);
    const row = await rowFor('Grace Hopper');

    expect(within(row).getByText('Needs recalculation')).toBeTruthy();
    expect((within(row).getByRole('button', { name: 'Finalize' }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(row).getByRole('button', { name: 'Download payslip' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps finalize and download behavior for an up-to-date payroll', async () => {
    testState.getPayroll.mockResolvedValue([otherEmployeePayroll, finalizedPayroll]);
    render(<Payroll />);

    const draftRow = await rowFor('Grace Hopper');
    expect((within(draftRow).getByRole('button', { name: 'Finalize' }) as HTMLButtonElement).disabled).toBe(false);
    const finalizedRow = await rowFor('Linus Torvalds');
    expect((within(finalizedRow).getByRole('button', { name: 'Download payslip' }) as HTMLButtonElement).disabled).toBe(false);
    expect(within(finalizedRow).queryByText('Needs recalculation')).toBeNull();
  });

  it('shows the revision of a reopened payroll', async () => {
    testState.getPayroll.mockResolvedValue([revisedPayroll]);
    render(<Payroll />);

    expect(within(await rowFor('Linus Torvalds')).getByText('Rev 2')).toBeTruthy();
  });

  it('previews the financial difference without changing payroll, then applies it', async () => {
    testState.getPayroll.mockResolvedValue([stalePayroll]);
    testState.previewPayrollRecalculation.mockResolvedValue({
      payrollId: 4, employeeId: 8, month: 9, year: 2026, status: 'DRAFT', needsRecalculation: true, revision: 0,
      period: { startDate: '2026-08-29', endDate: '2026-09-28' },
      stored: {}, recalculated: {},
      differences: [
        { field: 'lopDays', stored: 1, recalculated: 0, delta: -1 },
        { field: 'netSalary', stored: 53343, recalculated: 56200, delta: 2857 },
      ],
      splitMixedLeaveIds: [], canRecalculate: true,
    });
    render(<Payroll />);

    fireEvent.click(within(await rowFor('Grace Hopper')).getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog', { name: 'Recalculation preview' });
    expect(await within(dialog).findByText('Net salary')).toBeTruthy();
    expect(dialog.textContent).toContain('+2,857');
    expect(dialog.textContent).toContain('2026-08-29 to 2026-09-28');
    expect(testState.recalculatePayroll).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply recalculation' }));
    await waitFor(() => expect(testState.recalculatePayroll).toHaveBeenCalledWith(4));
  });

  it('does not ask for a check-out in the preview', async () => {
    testState.getPayroll.mockResolvedValue([otherEmployeePayroll]);
    testState.previewPayrollRecalculation.mockResolvedValue({
      payrollId: 4, employeeId: 8, month: 9, year: 2026, status: 'DRAFT', needsRecalculation: false, revision: 0,
      period: { startDate: '2026-08-29', endDate: '2026-09-28' }, stored: {}, recalculated: {}, differences: [],
      splitMixedLeaveIds: [], canRecalculate: true,
    });
    render(<Payroll />);

    fireEvent.click(within(await rowFor('Grace Hopper')).getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog', { name: 'Recalculation preview' });
    expect(await within(dialog).findByText(/No changes/)).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/punch-out|check-out|Add Missed Attendance/i);
  });

  it('allows finalizing a clean draft payroll', async () => {
    testState.getPayroll.mockResolvedValue([otherEmployeePayroll]);
    testState.finalizePayroll.mockResolvedValue({ ...otherEmployeePayroll, status: 'FINALIZED' });
    render(<Payroll />);

    const finalize = within(await rowFor('Grace Hopper')).getByRole('button', { name: 'Finalize' }) as HTMLButtonElement;
    expect(finalize.disabled).toBe(false);
    fireEvent.click(finalize);
    await waitFor(() => expect(testState.finalizePayroll).toHaveBeenCalledWith(4));
  });

  it('requires a reason to reopen a finalized payroll', async () => {
    testState.getPayroll.mockResolvedValue([finalizedPayroll]);
    testState.reopenPayroll.mockResolvedValue({ ...finalizedPayroll, status: 'DRAFT', revision: 1, needsRecalculation: true });
    render(<Payroll />);

    fireEvent.click(within(await rowFor('Linus Torvalds')).getByRole('button', { name: 'Reopen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reopen payroll' });
    const submit = within(dialog).getByRole('button', { name: 'Reopen payroll' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: '   ' } });
    expect(submit.disabled).toBe(true);

    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Sept missed punch-out correction' } });
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(testState.reopenPayroll).toHaveBeenCalledWith(5, 'Sept missed punch-out correction'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Reopen payroll' })).toBeNull());
  });

  it('shows the backend error when reopen fails', async () => {
    testState.getPayroll.mockResolvedValue([finalizedPayroll]);
    testState.reopenPayroll.mockRejectedValue(new Error('Only finalized payroll can be reopened'));
    render(<Payroll />);

    fireEvent.click(within(await rowFor('Linus Torvalds')).getByRole('button', { name: 'Reopen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reopen payroll' });
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Fix' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reopen payroll' }));

    expect(await within(dialog).findByText('Only finalized payroll can be reopened')).toBeTruthy();
  });

  it.each(['EMPLOYEE', 'FINANCE_MANAGER'])('hides preview and reopen from %s', async (role) => {
    testState.role = role;
    testState.getMyPayroll.mockResolvedValue([finalizedPayroll]);
    render(<Payroll />);

    await waitFor(() => expect(testState.getMyPayroll).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reopen' })).toBeNull();
  });
});
