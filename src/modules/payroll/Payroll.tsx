import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, DataTable, EmptyState, ErrorState, PageHeader, Skeleton, StatCard, type DataTableColumn, ModalPortal } from '../../components/ui/components';
import { Download, CreditCard, DollarSign, TrendingUp, Calendar, Plus } from 'lucide-react';
import { usePayroll } from '../../hooks/usePayroll';
import { useAuth } from '../../context/AuthContext';
import { RunPayrollModal } from '../../components/payroll/RunPayrollModal';
import { AssignSalaryModal } from '../../components/payroll/AssignSalaryModal';
import { AddPayrollAdjustmentModal } from '../../components/payroll/AddPayrollAdjustmentModal';
import ApiService, { Payroll as PayrollType, EmployeeSalary, PayrollRecalculationPreview } from '../../services/api';

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Formats the backend-provided period dates (YYYY-MM-DD); no period calculation here */
export const formatPayrollPeriod = (payroll: Pick<PayrollType, 'month' | 'year' | 'period'>): string => {
  const formatDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return year && month && day ? `${day} ${MONTH_ABBREVIATIONS[month - 1]} ${year}` : null;
  };
  const start = payroll.period?.startDate ? formatDate(payroll.period.startDate) : null;
  const end = payroll.period?.endDate ? formatDate(payroll.period.endDate) : null;
  return start && end ? `${start} – ${end}` : `${payroll.month}/${payroll.year}`;
};

const PREVIEW_FIELD_LABELS: Record<string, string> = {
  salaryId: 'Salary record',
  workingDays: 'Working days',
  presentDays: 'Present days',
  lopDays: 'LOP days',
  paidLeaveDays: 'Paid leave days',
  basic: 'Basic',
  hra: 'HRA',
  conveyance: 'Conveyance',
  specialAllowance: 'Special allowance',
  otherAllowance: 'Other allowance',
  pf: 'PF',
  pt: 'PT',
  leaveDeduction: 'LOP deduction',
  otherDeduction: 'Other deduction',
  grossSalary: 'Gross salary',
  deductions: 'Total deductions',
  netSalary: 'Net salary',
};

// Helper functions to reduce complexity
const DEFAULT_SALARY_STRUCTURE = {
  id: 0,
  name: 'Default Structure',
  basicPercent: 35,
  hraPercent: 50,
  conveyancePercent: 10,
  pfPercent: 12,
  ptAmount: 200,
  healthInsurance: 500,
};

const getSalaryStructure = (salaryInfo: any) => {
  return salaryInfo?.structure || DEFAULT_SALARY_STRUCTURE;
};

const getMonthlyCTC = (salaryInfo: any): number => {
  return salaryInfo?.monthlyCTC ?? (salaryInfo?.annualCTC ? salaryInfo.annualCTC / 12 : 0);
};

const getSalaryInfo = (employeeSalaries: EmployeeSalary[], employeeDetails: any): any => {
  return employeeSalaries.length > 0 ? employeeSalaries[0] : employeeDetails?.salaries?.[0];
};

const getDigitalSalaryValue = (currentPayroll: PayrollType | null, loadingDetails: boolean, salaryInfo: any): string => {
  if (currentPayroll) {
    return `₹${currentPayroll.netSalary?.toLocaleString() || '0'}`;
  }
  if (loadingDetails) return 'Loading...';
  if (salaryInfo?.annualCTC) return `₹${salaryInfo.annualCTC.toLocaleString()}`;
  return 'Not Assigned';
};

const buildSalarySummary = (currentPayroll: PayrollType | null, salaryInfo: any, loading: boolean, loadingDetails: boolean) => {
  if (loading || loadingDetails) {
    return <p className="text-slate-400 text-sm">Loading...</p>;
  }

  if (currentPayroll) {
    return (
      <>
        <div className="flex justify-between text-sm mb-1 text-slate-300">
          <span>Month</span>
          <span>{formatPayrollPeriod(currentPayroll)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-300">
          <span>Present Days</span>
          <span>{currentPayroll.presentDays} / {currentPayroll.workingDays}</span>
        </div>
      </>
    );
  }

  if (salaryInfo) {
    return (
      <>
        <div className="flex justify-between text-sm mb-1 text-slate-300">
          <span>Monthly CTC</span>
          <span>₹{salaryInfo.monthlyCTC?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-300">
          <span>Effective From</span>
          <span>{new Date(salaryInfo.effectiveFrom).toLocaleDateString()}</span>
        </div>
      </>
    );
  }

  return <p className="text-slate-400 text-sm">Salary not assigned yet</p>;
};

const getFormattedSalaryValue = (
  currentPayroll: PayrollType | null,
  salaryInfo: any,
  _computedValue: number,
  fallbackKey: string,
  leading = '₹'
) => {
  if (currentPayroll) {
    const value = currentPayroll[fallbackKey]?.toLocaleString() || '0';
    return `${leading}${value}`;
  }
  return salaryInfo ? 'Not finalized' : `${leading}0`;
};

const shouldShowManagementButtons = (role: string): boolean => {
  const upperRole = role?.toUpperCase();
  return ['SUPER_ADMIN', 'CEO', 'HR', 'FINANCE_MANAGER'].includes(upperRole);
};

const Payroll = () => {
  const { user } = useAuth();
  const { payrolls, loading, error, fetchPayroll, recalculatePayroll, previewRecalculation, reopenPayroll } = usePayroll(user?.role);
  const [previewState, setPreviewState] = useState<{
    payroll: PayrollType;
    data: PayrollRecalculationPreview | null;
    error: string | null;
  } | null>(null);
  const [reopenState, setReopenState] = useState<{
    payroll: PayrollType;
    reason: string;
    submitting: boolean;
    error: string | null;
  } | null>(null);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);
  const [isAssignSalaryOpen, setIsAssignSalaryOpen] = useState(false);
  const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const refreshEmployeeDetails = async () => {
    if (!user?.employeeId) return;

    setLoadingDetails(true);
    try {
      // Primary source: /employees/me includes salaries and payrolls for current user
      const meDetails = await ApiService.getMyEmployeeDetails();
      setEmployeeDetails(meDetails);

      // Use salary data from /employees/me for all users (most reliable source)
      setEmployeeSalaries(meDetails?.salaries || []);
    } catch (err) {
      console.error('Failed to fetch employee details:', err);
      setEmployeeDetails(null);
      setEmployeeSalaries([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    // Fetch payroll data for current user or all employees (depending on role)
    if (user?.employeeId) {
      fetchPayroll(user.employeeId).catch(err => console.error('Failed to fetch payroll:', err));
      refreshEmployeeDetails();
    }
  }, [user?.employeeId, fetchPayroll]);

  const isOrganizationPayrollView = ['SUPER_ADMIN', 'CEO', 'HR'].includes(String(user?.role ?? '').toUpperCase());
  const currentPayroll = isOrganizationPayrollView
    ? payrolls.find((payroll) => payroll.employeeId === user?.employeeId) ?? null
    : payrolls[0] ?? null;

  const handleAddAdjustment = (payroll: PayrollType) => {
    setSelectedPayroll(payroll);
    setIsAddAdjustmentOpen(true);
  };

  const handleDownloadPayslip = async (payrollId: number) => {
    try {
      await ApiService.downloadPayslip(payrollId);
    } catch (err) {
      alert('Failed to download payslip: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleFinalizePayroll = async (payrollId: number) => {
    try {
      await ApiService.finalizePayroll(payrollId);
      if (user?.employeeId) await fetchPayroll(user.employeeId);
    } catch (err) {
      alert('Failed to finalize payroll: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRecalculatePayroll = async (payrollId: number) => {
    try {
      await recalculatePayroll(payrollId);
      if (user?.employeeId) await fetchPayroll(user.employeeId);
    } catch (err) {
      alert('Failed to recalculate payroll: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handlePreviewRecalculation = async (payroll: PayrollType) => {
    setPreviewState({ payroll, data: null, error: null });
    try {
      const data = await previewRecalculation(payroll.id);
      setPreviewState({ payroll, data, error: null });
    } catch (err) {
      setPreviewState({ payroll, data: null, error: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleRecalculateFromPreview = async (payrollId: number) => {
    setPreviewState(null);
    await handleRecalculatePayroll(payrollId);
  };

  const handleReopenSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reopenState) return;
    const reason = reopenState.reason.trim();
    if (!reason) {
      setReopenState({ ...reopenState, error: 'A reason is required to reopen payroll.' });
      return;
    }

    setReopenState({ ...reopenState, submitting: true, error: null });
    try {
      await reopenPayroll(reopenState.payroll.id, reason);
      setReopenState(null);
      if (user?.employeeId) await fetchPayroll(user.employeeId);
    } catch (err) {
      setReopenState({
        ...reopenState,
        submitting: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center p-6">
        <ErrorState message={<><strong>Error loading payroll</strong><span className="block mt-1">{error}</span></>} />
      </div>
    );
  }

  const salaryInfo = getSalaryInfo(employeeSalaries, employeeDetails);

  // Use employee's salary structure if embedded, otherwise use default
  const monthlyCTC = getMonthlyCTC(salaryInfo);

  const digitalSalaryValue = getDigitalSalaryValue(currentPayroll, loadingDetails, salaryInfo);
  const salarySummaryElement = buildSalarySummary(currentPayroll, salaryInfo, loading, loadingDetails);

  const basicPayValue = getFormattedSalaryValue(currentPayroll, salaryInfo, 0, 'basic');
  const grossSalaryValue = getFormattedSalaryValue(currentPayroll, salaryInfo, monthlyCTC, 'grossSalary');
  const deductionsValue = getFormattedSalaryValue(currentPayroll, salaryInfo, 0, 'deductions', '-₹');
  const currency = (value?: number | null) => `₹${value !== undefined && value !== null ? value.toLocaleString() : '0'}`;
  const canRecalculatePayroll = ['SUPER_ADMIN', 'CEO', 'HR'].includes(String(user?.role ?? '').toUpperCase());
  const payrollColumns: DataTableColumn<PayrollType>[] = [
    ...(isOrganizationPayrollView ? [{
      key: 'employee',
      header: 'Employee',
      render: (payroll: PayrollType) => (
        <div className="min-w-[150px]">
          <div className="font-semibold text-[#12354a]">
            {[payroll.employee?.firstName, payroll.employee?.lastName].filter(Boolean).join(' ')
              || `Employee #${payroll.employeeId}`}
          </div>
          <div className="text-xs text-slate-500">{payroll.employee?.empCode || `ID ${payroll.employeeId}`}</div>
        </div>
      ),
    }] : []),
    { key: 'period', header: 'Period', render: (payroll) => <span className="whitespace-nowrap font-bold text-[#12354a]">{formatPayrollPeriod(payroll)}</span> },
    { key: 'workingDays', header: 'Working days', render: (payroll) => payroll.workingDays },
    { key: 'presentDays', header: 'Present', render: (payroll) => payroll.presentDays },
    { key: 'lopDays', header: 'LOP days', render: (payroll) => payroll.lopDays },
    { key: 'status', header: 'Status', render: (payroll) => (
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded-full border px-2 py-1 text-xs font-semibold">{payroll.status}</span>
        {payroll.needsRecalculation && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800" title="Attendance, leave or holiday data changed after this payroll was calculated">
            Needs recalculation
          </span>
        )}
        {(payroll.revision ?? 0) > 0 && (
          <span className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600">
            Rev {payroll.revision}
          </span>
        )}
      </div>
    ) },
    { key: 'grossSalary', header: 'Gross', render: (payroll) => <span className="font-semibold text-[#19704b]">{currency(payroll.grossSalary)}</span> },
    { key: 'deductions', header: 'Deductions', render: (payroll) => <span className="font-semibold text-[#a63e35]">-{currency(payroll.deductions)}</span> },
    { key: 'netSalary', header: 'Net salary', render: (payroll) => <span className="text-base font-bold text-[#073b5c]">{currency(payroll.netSalary)}</span> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (payroll) => {
      const isStale = Boolean(payroll.needsRecalculation);
      const downloadTitle = payroll.status === 'DRAFT'
        ? 'Finalize payroll before downloading'
        : isStale ? 'Recalculate payroll before downloading' : 'Download payslip';
      return (
        <div className="flex justify-end gap-1">
          {canRecalculatePayroll && payroll.status !== 'PAID' && <Button size="xs" variant="ghost" onClick={() => handlePreviewRecalculation(payroll)}>Preview</Button>}
          {canRecalculatePayroll && payroll.status === 'DRAFT' && <Button size="xs" variant="ghost" onClick={() => handleRecalculatePayroll(payroll.id)} disabled={loading}>Recalculate</Button>}
          {canRecalculatePayroll && payroll.status === 'FINALIZED' && <Button size="xs" variant="ghost" onClick={() => setReopenState({ payroll, reason: '', submitting: false, error: null })}>Reopen</Button>}
          {shouldShowManagementButtons(user?.role) && <Button size="xs" variant="ghost" onClick={() => handleAddAdjustment(payroll)} disabled={payroll.status !== 'DRAFT'}>+ Adjust</Button>}
          {shouldShowManagementButtons(user?.role) && payroll.status === 'DRAFT' && <Button size="xs" variant="ghost" onClick={() => handleFinalizePayroll(payroll.id)} disabled={isStale} title={isStale ? 'Recalculate payroll before finalizing' : undefined}>Finalize</Button>}
          <Button size="xs" variant="ghost" aria-label="Download payslip" title={downloadTitle} onClick={() => handleDownloadPayslip(payroll.id)} disabled={payroll.status === 'DRAFT' || isStale}><Download size={14} /></Button>
        </div>
      );
    } },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Payroll" description="Review salary details and access your authorized payslips." actions={<div className="flex flex-wrap gap-2">
          {shouldShowManagementButtons(user?.role) && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setIsRunPayrollOpen(true)} disabled={loading}>
                <Plus size={16} /> Run payroll
              </Button>
              <Button variant="gold" className="gap-2" onClick={() => setIsAssignSalaryOpen(true)} disabled={loading}>
                <Plus size={16} /> Assign salary
              </Button>
            </>
          )}
        </div>} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Digital Salary Card */}
        <div className="lg:col-span-1">
            <div className="relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#022337] to-[#073b5c] p-6 text-white shadow-[0_18px_42px_rgba(2,35,55,0.2)]">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[#b8d0d5]">
                          {currentPayroll ? 'Net Salary' : 'Annual CTC'}
                        </p>
                        <h2 className="mt-1 text-3xl font-bold text-[#fffefa]">{digitalSalaryValue}</h2>
                    </div>
                    <CreditCard className="text-[#e3c477]" />
                </div>

                <div className="relative z-10">{salarySummaryElement}</div>
            </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2"><StatCard label="Basic pay" value={basicPayValue} icon={<DollarSign size={18} />} /><StatCard label="Gross salary" value={grossSalaryValue} icon={<TrendingUp size={18} />} /><StatCard label="Deductions" value={deductionsValue} detail={currentPayroll ? `${currentPayroll.lopDays} LOP days` : undefined} icon={<Calendar size={18} />} /></div>
      </div>

      {currentPayroll && (
        <Card hoverEffect className="overflow-hidden">
          <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70"><CardTitle className="text-base">Payroll details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between rounded-xl border border-[#dce6e8] bg-[#f6faf9] p-3">
                <span className="text-[#617984]">Basic</span>
                <span className="font-semibold text-[#12354a]">₹{currentPayroll.basic?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between rounded-xl border border-[#dce6e8] bg-[#f6faf9] p-3">
                <span className="text-[#617984]">HRA</span>
                <span className="font-semibold text-[#12354a]">₹{currentPayroll.hra?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Conveyance</span>
                <span className="font-semibold">₹{(currentPayroll as any).conveyance?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Special Allowance</span>
                <span className="font-semibold">₹{currentPayroll.specialAllowance?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">PF</span>
                <span className="font-semibold">₹{currentPayroll.pf?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">PT</span>
                <span className="font-semibold">₹{currentPayroll.pt?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">LOP Deduction</span>
                <span className="font-semibold">₹{currentPayroll.leaveDeduction?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">LOP Days</span>
                <span className="font-semibold">{currentPayroll.lopDays}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Working Days</span>
                <span className="font-semibold">{currentPayroll.presentDays} Present / {currentPayroll.workingDays}</span>
              </div>
            </div>

            {currentPayroll.others && currentPayroll.others.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900 mb-3">Additional Adjustments</h4>
                <div className="space-y-2">
                  {currentPayroll.others.map((adj) => (
                    <div key={adj.id} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                      <span className={adj.type === 'ALLOWANCE' ? 'text-emerald-600' : 'text-rose-600'}>
                        {adj.name}
                      </span>
                      <span className="font-semibold">
                        {adj.type === 'ALLOWANCE' ? '+' : '-'}₹{adj.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shouldShowManagementButtons(user?.role) && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleAddAdjustment(currentPayroll)}
                >
                  <Plus size={14} /> Add Adjustment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Card hoverEffect className="overflow-hidden">
        <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70"><CardTitle className="text-base">Payroll history</CardTitle></CardHeader>
        <CardContent className="p-0">
            {loading && payrolls.length === 0 ? (
              <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div>
            ) : payrolls.length === 0 ? (
              <EmptyState title="No payroll records" description="Authorized payroll records will appear here when available." />
            ) : (
              <DataTable columns={payrollColumns} data={payrolls} getRowKey={(payroll) => payroll.id} />
            )}
        </CardContent>
      </Card>

      {previewState && (
        <ModalPortal><div role="dialog" aria-label="Recalculation preview" className="app-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#12354a]">
              Recalculation preview — {formatPayrollPeriod(previewState.payroll)}
            </h2>
            {!previewState.data && !previewState.error && <p className="mt-4 text-sm text-slate-500">Loading preview...</p>}
            {previewState.error && <p className="mt-4 text-sm text-rose-700">{previewState.error}</p>}
            {previewState.data && (
              <div className="mt-4 space-y-4 text-sm">
                <p className="text-slate-600">
                  Payroll period {previewState.data.period.startDate} to {previewState.data.period.endDate}. Nothing has been changed yet.
                </p>
                {previewState.data.splitMixedLeaveIds.length > 0 && (
                  <p className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-slate-700">
                    A leave with both paid and LOP days crosses this payroll period. Paid days are counted first in date order.
                  </p>
                )}
                {previewState.data.differences.length === 0 ? (
                  <p className="font-semibold text-[#19704b]">No changes: the stored payroll matches current attendance and leave.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-xs uppercase text-slate-500">
                        <th className="py-2">Field</th><th className="py-2 text-right">Stored</th><th className="py-2 text-right">Recalculated</th><th className="py-2 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewState.data.differences.map((difference) => (
                        <tr key={difference.field} className="border-b">
                          <td className="py-2">{PREVIEW_FIELD_LABELS[difference.field] ?? difference.field}</td>
                          <td className="py-2 text-right">{difference.stored?.toLocaleString() ?? '—'}</td>
                          <td className="py-2 text-right font-semibold">{difference.recalculated?.toLocaleString() ?? '—'}</td>
                          <td className="py-2 text-right">{difference.delta === null ? '—' : `${difference.delta > 0 ? '+' : ''}${difference.delta.toLocaleString()}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {previewState.data.historicalAdjustments?.issues.map((issue) => (
                  <p
                    key={issue.code}
                    className={issue.blocking
                      ? 'rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700'
                      : 'rounded-lg border border-slate-300 bg-slate-50 p-3 text-slate-700'}
                  >
                    {issue.message}
                  </p>
                ))}
                {!previewState.data.canRecalculate && previewState.data.differences.length > 0 && (
                  <p className="text-slate-600">This payroll is {previewState.data.status}. Reopen it to apply these changes.</p>
                )}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setPreviewState(null)}>Close</Button>
              {previewState.data?.canRecalculate && !previewState.data.historicalAdjustments?.blocksRecalculation && (
                <Button size="sm" onClick={() => handleRecalculateFromPreview(previewState.payroll.id)} disabled={loading}>
                  Apply recalculation
                </Button>
              )}
            </div>
          </div>
        </div></ModalPortal>
      )}

      {reopenState && (
        <ModalPortal><div role="dialog" aria-label="Reopen payroll" className="app-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={handleReopenSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#12354a]">
              Reopen payroll {formatPayrollPeriod(reopenState.payroll)}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              The payroll returns to DRAFT and must be recalculated and finalized again. The employee's payslip will be marked as revised.
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Reason for correction
              <textarea
                value={reopenState.reason}
                onChange={(event) => setReopenState({ ...reopenState, reason: event.target.value, error: null })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                rows={3}
                required
              />
            </label>
            {reopenState.error && <p className="mt-2 text-sm text-rose-700">{reopenState.error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setReopenState(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={reopenState.submitting || !reopenState.reason.trim()}>
                {reopenState.submitting ? 'Reopening...' : 'Reopen payroll'}
              </Button>
            </div>
          </form>
        </div></ModalPortal>
      )}

      {/* Modals */}
      <RunPayrollModal
        isOpen={isRunPayrollOpen}
        onClose={() => setIsRunPayrollOpen(false)}
        onSuccess={() => {
          if (user?.employeeId) {
            fetchPayroll(user.employeeId);
          }
        }}
      />

      <AssignSalaryModal
        isOpen={isAssignSalaryOpen}
        onClose={() => setIsAssignSalaryOpen(false)}
        onSuccess={() => {
          // Refresh payroll + salary details after successful assignment
          if (user?.employeeId) {
            fetchPayroll(user.employeeId);
            refreshEmployeeDetails();
          }
        }}
      />

      {selectedPayroll && (
        <AddPayrollAdjustmentModal
          isOpen={isAddAdjustmentOpen}
          onClose={() => setIsAddAdjustmentOpen(false)}
          payrollId={selectedPayroll.id}
          onSuccess={() => {
            if (user?.employeeId) {
              fetchPayroll(user.employeeId);
            }
          }}
        />
      )}
    </div>
  );
};

export default Payroll;