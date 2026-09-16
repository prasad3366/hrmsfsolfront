import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Home,
  Laptop,
  LifeBuoy,
  Plus,
  Users,
} from 'lucide-react';
import ApiService from '../../services/api';
import { getAttendanceLocationLabel } from '../../hooks/useAttendance';
import { attendanceDateKey, formatAttendanceDate } from '../../utils/attendanceDate';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import CreateHolidayModal from '../../components/holidays/CreateHolidayModal';
import { RunPayrollModal } from '../../components/payroll/RunPayrollModal';
import { useHolidays } from '../../hooks/useHolidays';

type Props = { role: string };

type Metric = { label: string; value: string | number; detail?: string; icon: typeof Users; tone?: 'blue' | 'green' | 'amber' | 'slate' };

type AttendanceRecord = {
  employeeId?: number;
  employee?: { id: number; firstName?: string; lastName?: string; name?: string };
  date?: string;
  totalHours?: number | null;
  status?: string;
  clockIn?: string | null;
  clockOut?: string | null;
  punchIn?: string | null;
  punchOut?: string | null;
  punchInLocationStatus?: 'OFFICE' | 'OUTSIDE' | 'WFH' | null;
  punchOutLocationStatus?: 'OFFICE' | 'OUTSIDE' | 'WFH' | null;
};

const toneClasses = {
  blue: 'border-[#cce1e8] bg-[#eaf3f7] text-[#1e627d]',
  green: 'border-[#c8ead9] bg-[#eaf7f1] text-[#19704b]',
  amber: 'border-[#f0ddb1] bg-[#fff7e7] text-[#8b641b]',
  slate: 'border-[#d5e1e3] bg-[#edf3f5] text-[#486271]',
};

const formatRole = (role: string) => role.replaceAll('_', ' ');
const displayDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable';
const displayTime = (value?: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not recorded';
const statusLabel = (value?: string | null) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) : 'Not started';

const MetricCard = ({ metric }: { metric: Metric }) => {
  const Icon = metric.icon;
  return (
    <div className={`dashboard-metric rounded-2xl border bg-gradient-to-br from-white/95 to-[#f2f8f7]/90 p-5 shadow-[0_12px_30px_rgba(7,59,92,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(7,59,92,0.13)] ${metric.tone ? toneClasses[metric.tone].split(' ').slice(0, 1).join(' ') : 'border-[#dce6e8]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#617984]">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#073b5c]">{metric.value}</p>
          {metric.detail && <p className="mt-1 text-xs text-[#617984]">{metric.detail}</p>}
        </div>
        <span className={`rounded-lg border p-2.5 ${toneClasses[metric.tone ?? 'slate']}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      </div>
    </div>
  );
};

const Section = ({ title, eyebrow, action, children, className = '' }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`dashboard-section overflow-hidden rounded-2xl border border-[#dce6e8] bg-gradient-to-br from-white/95 to-[#f2f8f7]/85 shadow-[0_12px_30px_rgba(7,59,92,0.07)] ${className}`}>
    <div className="flex items-center justify-between gap-4 border-b border-[#e4ecec] px-5 py-4">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78909a]">{eyebrow}</p>}
        <h2 className="mt-1 text-base font-bold text-[#073b5c]">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ message }: { message: string }) => <div className="flex min-h-28 items-center justify-center px-5 py-6 text-center text-sm text-[#78909a]">{message}</div>;

const todayBusinessDateKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const TodayEmployeeAttendance = ({ records, employees, visible }: { records: AttendanceRecord[]; employees: any[]; visible: boolean }) => {
  if (!visible) return null;

  const today = todayBusinessDateKey();
  const todayRecords = new Map(records.filter((record) => attendanceDateKey(record.date ?? '') === today).map((record) => [Number(record.employeeId ?? record.employee?.id), record]));
  const rows = employees.map((employee) => ({ employee, record: todayRecords.get(Number(employee.id)) }));

  return <Section title="Today's Employee Attendance" eyebrow={formatAttendanceDate(today)}>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Employee Name</th><th className="px-5 py-3">Check-In Time</th><th className="px-5 py-3">Check-Out Time</th><th className="px-5 py-3">Location</th></tr></thead><tbody>{rows.length ? rows.map(({ employee, record }) => { const location = getAttendanceLocationLabel(record?.punchInLocationStatus, record?.punchOutLocationStatus); return <tr key={employee.id} className="border-t border-slate-100"><td className="px-5 py-3">{formatAttendanceDate(today)}</td><td className="px-5 py-3 font-medium text-slate-800">{`${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || employee.name || employee.empCode || 'Unknown'}</td><td className="px-5 py-3">{displayTime(record?.punchIn)}</td><td className="px-5 py-3">{displayTime(record?.punchOut)}</td><td className="px-5 py-3">{location}</td></tr>; }) : <tr><td colSpan={5}><EmptyState message="No employees available for attendance today." /></td></tr>}</tbody></table></div>
  </Section>;
};

const ActionButton = ({ label, icon: Icon, onClick }: { label: string; icon: typeof Users; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="quick-action-button group flex items-center gap-3 rounded-xl border border-[#dce6e8] bg-white/75 px-3 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#b8ccd0] hover:bg-[#f6faf9] hover:shadow-[0_8px_18px_rgba(7,59,92,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e] focus-visible:ring-offset-2"
  >
    <span className="rounded-lg bg-[#eaf3f7] p-2 text-[#1e627d] group-hover:bg-[#fff7e7] group-hover:text-[#b08a3e]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1 text-sm font-semibold text-[#12354a]">{label}</span>
    <ArrowRight className="h-4 w-4 text-[#78909a]" aria-hidden="true" />
  </button>
);

const WeeklyHours = ({ records }: { records: AttendanceRecord[] }) => {
  const points = useMemo(() => records.slice(-7).map((record) => ({
    label: record.date ? new Date(record.date).toLocaleDateString(undefined, { weekday: 'short' }) : 'Day',
    hours: Number(record.totalHours ?? 0),
  })), [records]);
  const maxHours = Math.max(...points.map((point) => point.hours), 1);
  if (!points.length) return <EmptyState message="No attendance hours recorded for this period." />;
  return (
    <div className="px-5 pb-5 pt-6">
      <div className="flex h-48 items-end gap-2 sm:gap-4">
        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">{point.hours > 0 ? `${point.hours.toFixed(1)}h` : '-'}</span>
            <div className="flex h-32 w-full items-end rounded-md bg-[#edf3f5] px-1">
              <div className="w-full rounded-md bg-gradient-to-t from-[#073b5c] to-[#1e627d] shadow-[0_0_14px_rgba(30,98,125,0.25)] transition-all" style={{ height: `${point.hours ? Math.max((point.hours / maxHours) * 100, 8) : 0}%` }} />
            </div>
            <span className="text-xs text-slate-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkforceChart = ({ workforce }: { workforce: any }) => {
  const points = [
    ['Present', workforce?.present ?? 0, 'bg-emerald-500'],
    ['Late', workforce?.late ?? 0, 'bg-amber-500'],
    ['Half day', workforce?.halfDay ?? 0, 'bg-blue-500'],
    ['Leave', workforce?.leave ?? 0, 'bg-violet-500'],
    ['Absent', workforce?.absent ?? 0, 'bg-rose-500'],
  ] as const;
  const maximum = Math.max(...points.map((point) => point[1]), 1);
  return <div className="space-y-4 px-5 py-6">{points.map(([label, value, color]) => <div key={label}><div className="mb-1.5 flex justify-between text-sm"><span className="text-[#617984]">{label}</span><span className="font-semibold text-[#12354a]">{value}</span></div><div className="h-2 rounded-full bg-[#e6eeee]"><div className={`h-2 rounded-full ${color}`} style={{ width: `${value ? Math.max((value / maximum) * 100, 4) : 0}%` }} /></div></div>)}</div>;
};

function useCompanionData(role: string, employeeMode: boolean) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [organizationAttendance, setOrganizationAttendance] = useState<AttendanceRecord[]>([]);
  const [organizationEmployees, setOrganizationEmployees] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [helpdesk, setHelpdesk] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const current = new Date();
    const loads: Promise<void>[] = [];
    if (employeeMode) {
      loads.push(ApiService.getMyAttendance(current.getMonth() + 1, current.getFullYear(), 1, 31).then((result) => { if (active) setAttendance(result.data ?? []); }).catch(() => undefined));
      loads.push(ApiService.getMyHolidays().then((result) => { if (active) setHolidays(result ?? []); }).catch(() => undefined));
      loads.push(ApiService.getMyAssets().then((result) => { if (active) setAssets(result ?? []); }).catch(() => undefined));
    }
    if (['SUPER_ADMIN', 'CEO', 'HR'].includes(role)) {
      loads.push(ApiService.getAttendance().then((result) => { if (active) setOrganizationAttendance(result ?? []); }).catch(() => undefined));
      loads.push(ApiService.getAttendanceEmployees().then((result) => { if (active) setOrganizationEmployees(result.data ?? []); }).catch(() => undefined));
      loads.push(ApiService.getHelpdeskTickets().then((result) => { if (active) setHelpdesk(result ?? []); }).catch(() => undefined));
    }
    Promise.all(loads);
    return () => { active = false; };
  }, [employeeMode, role]);

  return { attendance, organizationAttendance, organizationEmployees, holidays, assets, helpdesk };
}

export default function RichDashboard({ role }: Props) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);
  const [isCreateHolidayOpen, setIsCreateHolidayOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { createHoliday, isSubmitting: isHolidaySubmitting } = useHolidays();
  const employeeMode = role === 'EMPLOYEE';
  const { attendance, organizationAttendance, organizationEmployees, holidays, assets, helpdesk } = useCompanionData(role, employeeMode);

  useEffect(() => {
    let active = true;
    ApiService.getDashboard().then((result) => active && setDashboard(result)).catch((reason) => active && setError(reason instanceof Error ? reason.message : 'Failed to load dashboard'));
    return () => { active = false; };
  }, []);

  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>;
  if (!dashboard) return <div role="status" className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading your live dashboard...</div>;

  const employee = dashboard.employee;
  const name = employee ? `${employee.firstName} ${employee.lastName}`.trim() : formatRole(role);
  const today = new Date();
  const dateText = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (employeeMode) {
    const month = dashboard.month ?? {};
    const balance = (dashboard.leaveBalance ?? []).reduce((total: number, item: any) => total + Number(item.remaining ?? 0), 0);
    const upcomingHolidays = holidays.filter((holiday) => new Date(holiday.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, 4);
    const activeWfh = (dashboard.wfh ?? []).slice(0, 5);
    const latestPayroll = dashboard.payroll;
    const metrics: Metric[] = [
      { label: 'Leave balance', value: `${balance} days`, detail: 'Across available leave types', icon: CalendarDays, tone: 'blue' },
      { label: 'Present this month', value: month.presentDays ?? 0, detail: `${month.halfDays ?? 0} half days`, icon: CheckCircle2, tone: 'green' },
      { label: 'Pending requests', value: dashboard.pendingLeaveRequests ?? 0, detail: `${activeWfh.filter((item: any) => item.status === 'PENDING').length} WFH pending`, icon: Clock3, tone: 'amber' },
      { label: 'Latest payroll', value: latestPayroll ? 'Available' : 'No record', detail: latestPayroll ? `${latestPayroll.month}/${latestPayroll.year}` : 'No payslip generated', icon: FileText, tone: 'slate' },
    ];
    return <div className="space-y-7">
      <header className="dashboard-hero relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#022337] via-[#073b5c] to-[#0d526b] px-6 py-7 text-white shadow-[0_20px_48px_rgba(2,35,55,0.22)] sm:px-8"><div className="dashboard-hero__light" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#b8d0d5]">{dateText}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Good to see you, {name}</h1><p className="mt-2 text-sm text-[#d5e6e8]">{employee.designation || 'Employee'}{employee.department ? ` · ${employee.department}` : ''}</p></div><div className="rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-[#e5f0f0]">{statusLabel(dashboard.today?.status)}</div></div></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Section title="Weekly working hours" eyebrow="Attendance overview"><WeeklyHours records={attendance} /></Section><Section title="Today's attendance" eyebrow="Live status"><div className="space-y-4 px-5 py-5 text-sm"><div className="flex items-center justify-between"><span className="text-slate-500">Status</span><span className="font-semibold text-slate-900">{statusLabel(dashboard.today?.status)}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Clock in</span><span className="font-medium text-slate-800">{displayTime(dashboard.today?.punchInTime)}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Clock out</span><span className="font-medium text-slate-800">{displayTime(dashboard.today?.punchOutTime)}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Worked hours</span><span className="font-medium text-slate-800">{dashboard.today?.totalHours ?? 'Not recorded'}</span></div><button type="button" onClick={() => navigate('/attendance')} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Open attendance <ArrowRight className="h-4 w-4" /></button></div></Section></div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Section title="Quick actions"><div className="grid gap-3 p-5 sm:grid-cols-2"><ActionButton label="View payslip" icon={FileText} onClick={() => navigate('/payroll')} /><ActionButton label="Request leave" icon={CalendarDays} onClick={() => navigate('/leave')} /><ActionButton label="Request work from home" icon={Home} onClick={() => navigate('/wfh')} /><ActionButton label="View performance" icon={BriefcaseBusiness} onClick={() => navigate('/performance')} /></div></Section><Section title="WFH requests" eyebrow="Recent requests">{activeWfh.length ? <div className="divide-y divide-slate-100">{activeWfh.map((item: any) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><div><p className="font-medium text-slate-800">{displayDate(item.startDate)} - {displayDate(item.endDate)}</p><p className="mt-1 text-xs text-slate-500">{item.reason || 'No reason provided'}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{statusLabel(item.status)}</span></div>)}</div> : <EmptyState message="No WFH requests yet." />}</Section></div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Section title="Upcoming holidays"><div className="divide-y divide-slate-100">{upcomingHolidays.length ? upcomingHolidays.map((holiday: any) => <div key={holiday.id} className="flex items-center justify-between gap-4 px-5 py-3"><div><p className="text-sm font-medium text-slate-800">{holiday.name}</p><p className="text-xs text-slate-500">{holiday.isOptional ? 'Optional holiday' : 'Company holiday'}</p></div><time className="text-sm font-semibold text-slate-700">{displayDate(holiday.date)}</time></div>) : <EmptyState message="No upcoming holidays available." />}</div></Section><Section title="My assets"><div className="divide-y divide-slate-100">{assets.length ? assets.slice(0, 5).map((asset: any) => <div key={asset.id} className="flex items-center gap-3 px-5 py-3"><span className="rounded-md bg-slate-100 p-2 text-slate-600"><Laptop className="h-4 w-4" /></span><div><p className="text-sm font-medium text-slate-800">{asset.name}</p><p className="text-xs text-slate-500">{statusLabel(asset.status)}</p></div></div>) : <EmptyState message="No assigned assets found." />}</div></Section></div>
    </div>;
  }

  if (dashboard.role === 'FINANCE_MANAGER') {
    const payroll = dashboard.payroll ?? {};
    const metrics: Metric[] = [
      { label: 'Payroll population', value: dashboard.kpis?.payrollEmployeePopulation ?? 0, icon: Users, tone: 'blue' },
      { label: 'Draft payroll', value: dashboard.kpis?.draftPayrolls ?? 0, icon: FileText, tone: 'amber' },
      { label: 'Finalized payroll', value: dashboard.kpis?.finalizedPayrolls ?? 0, icon: CheckCircle2, tone: 'green' },
      { label: 'Paid payroll', value: dashboard.kpis?.paidPayrolls ?? 0, icon: CalendarDays, tone: 'slate' },
      { label: 'Pending leave', value: dashboard.kpis?.pendingLeaveRequests ?? 0, icon: Clock3, tone: 'slate' },
    ];
    const pendingLeaves = dashboard.pendingActions?.leave ?? [];
    return <div className="space-y-7"><header className="rounded-xl bg-slate-950 px-6 py-7 text-white"><p className="text-sm text-slate-300">{dateText}</p><h1 className="mt-2 text-3xl font-semibold">Finance operations</h1><p className="mt-2 text-sm text-slate-300">Payroll status and totals from the current records.</p></header><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><Section title="Pending leave requests" eyebrow="Requests requiring review"><div className="divide-y divide-slate-100">{pendingLeaves.length ? pendingLeaves.slice(0, 5).map((leave: any) => <div key={leave.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span className="font-medium text-slate-800">{`${leave.employee?.firstName ?? ''} ${leave.employee?.lastName ?? ''}`.trim() || 'Employee'}</span><span className="text-slate-500">{statusLabel(leave.status)}</span></div>) : <EmptyState message="No pending leave requests." />}</div></Section><Section title="Payroll totals" eyebrow="Persisted payroll data"><div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">Gross total</p><p className="mt-2 text-2xl font-semibold text-slate-950">{payroll.grossTotal ?? 0}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Net total</p><p className="mt-2 text-2xl font-semibold text-slate-950">{payroll.netTotal ?? 0}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">LOP days</p><p className="mt-2 text-2xl font-semibold text-slate-950">{payroll.lopDays ?? 0}</p></div></div></Section></div>;
  }

  const kpis = dashboard.kpis ?? {};
  const metrics: Metric[] = [
    { label: dashboard.role === 'IT_MANAGER' || dashboard.role === 'SALES_MANAGER' ? 'Team size' : 'Total employees', value: kpis.totalEmployees ?? 0, icon: Users, tone: 'blue' },
    { label: 'Present today', value: kpis.presentToday ?? 0, icon: CheckCircle2, tone: 'green' },
    { label: 'On leave today', value: kpis.onLeaveToday ?? 0, icon: CalendarDays, tone: 'amber' },
    { label: 'Pending leave', value: kpis.pendingLeaveRequests ?? 0, icon: Clock3, tone: 'slate' },
    { label: 'Pending WFH', value: kpis.pendingWfhRequests ?? 0, icon: Home, tone: 'slate' },
    { label: 'Regularizations', value: kpis.pendingAttendanceRegularizations ?? 0, icon: Clock3, tone: 'slate' },
    ...(dashboard.hr ? [{ label: 'New joiners', value: dashboard.hr.newJoiners, icon: Plus, tone: 'blue' as const }] : []),
  ];
  const pendingLeaves = dashboard.pendingActions?.leave ?? [];
  const pendingWfh = dashboard.pendingActions?.wfh ?? [];
  const isOrg = ['SUPER_ADMIN', 'CEO', 'HR'].includes(dashboard.role);
  const exportAttendance = async () => {
    try {
      setActionError(null);
      const current = new Date();
      await ApiService.exportAttendance(current.getMonth() + 1, current.getFullYear());
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Failed to export attendance');
    }
  };

  return <>
    <div className="space-y-7"><header className="rounded-xl bg-slate-950 px-6 py-7 text-white sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-300">{dateText}</p><h1 className="mt-2 text-3xl font-semibold">{isOrg ? 'Organization operations' : `${formatRole(dashboard.role)} team`}</h1><p className="mt-2 text-sm text-slate-300">Live workforce visibility for your authorized scope.</p></div><div className="text-sm text-slate-300">{dashboard.scope?.employeeCount ?? 0} employees in scope</div></div></header><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]"><Section title="Today's workforce" eyebrow="Attendance status"><WorkforceChart workforce={dashboard.workforce} /></Section><Section title="Department summary" eyebrow="Authorized employee scope"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Department</th><th className="px-5 py-3">Headcount</th><th className="px-5 py-3">Present</th><th className="px-5 py-3">Leave</th><th className="px-5 py-3">Absent</th></tr></thead><tbody>{dashboard.departmentSummary?.length ? dashboard.departmentSummary.map((row: any) => <tr key={row.department} className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-800">{row.department}</td><td className="px-5 py-3">{row.employeeCount}</td><td className="px-5 py-3">{row.presentToday}</td><td className="px-5 py-3">{row.leaveToday}</td><td className="px-5 py-3">{row.absentToday}</td></tr>) : <tr><td colSpan={5}><EmptyState message="No department data available." /></td></tr>}</tbody></table></div></Section></div><div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Section title="Pending leave requests" eyebrow="Requires review" action={<button type="button" onClick={() => navigate('/leave')} className="text-xs font-semibold text-slate-600 hover:text-slate-950">View all</button>}>{pendingLeaves.length ? <div className="divide-y divide-slate-100">{pendingLeaves.slice(0, 6).map((leave: any) => <div key={leave.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-800">{leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Employee request'}</p><p className="mt-1 text-xs text-slate-500">{leave.leaveType?.name || 'Leave'} · {leave.totalDays ?? 0} days · {leave.reason || 'No reason provided'}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span></div>)}</div> : <EmptyState message="No pending leave requests." />}</Section><Section title="Pending WFH requests" eyebrow="Requires review" action={<button type="button" onClick={() => navigate('/wfh')} className="text-xs font-semibold text-slate-600 hover:text-slate-950">View all</button>}>{pendingWfh.length ? <div className="divide-y divide-slate-100">{pendingWfh.slice(0, 6).map((request: any) => <div key={request.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-semibold text-slate-800">{request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : 'Employee request'}</p><p className="mt-1 text-xs text-slate-500">{displayDate(request.startDate)} - {displayDate(request.endDate)}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span></div>)}</div> : <EmptyState message="No pending WFH requests." />}</Section></div><div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]"><Section title="Quick actions"><div className="grid gap-3 p-5 sm:grid-cols-2">{actionError && <p role="alert" className="sm:col-span-2 text-sm text-rose-700">{actionError}</p>}<ActionButton label="Add employee" icon={Plus} onClick={() => { setActionError(null); setIsCreateEmployeeOpen(true); }} /><ActionButton label="Run payroll" icon={BriefcaseBusiness} onClick={() => { setActionError(null); setIsRunPayrollOpen(true); }} /><ActionButton label="Create holiday" icon={CalendarDays} onClick={() => { setActionError(null); setIsCreateHolidayOpen(true); }} /><ActionButton label="Export attendance" icon={Download} onClick={() => void exportAttendance()} /></div></Section><Section title="Helpdesk tickets" eyebrow="Live queue" action={<button type="button" onClick={() => navigate('/helpdesk')} className="text-xs font-semibold text-slate-600 hover:text-slate-950">Open helpdesk</button>}>{helpdesk.length ? <div className="divide-y divide-slate-100">{helpdesk.slice(0, 5).map((ticket: any) => <div key={ticket.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="flex min-w-0 items-center gap-3"><span className="rounded-md bg-slate-100 p-2 text-slate-600"><LifeBuoy className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{ticket.issue || 'Helpdesk ticket'}</p><p className="text-xs text-slate-500">{ticket.employee ? `${ticket.employee.firstName} ${ticket.employee.lastName}` : 'Employee request'}</p></div></div><span className="text-xs font-semibold text-slate-600">{statusLabel(ticket.status)}</span></div>)}</div> : <EmptyState message="No helpdesk tickets available." />}</Section></div></div>
    <TodayEmployeeAttendance records={organizationAttendance} employees={organizationEmployees} visible={isOrg} />
    <CreateEmployeeModal isOpen={isCreateEmployeeOpen} onClose={() => setIsCreateEmployeeOpen(false)} onSuccess={() => undefined} />
    <RunPayrollModal isOpen={isRunPayrollOpen} onClose={() => setIsRunPayrollOpen(false)} />
    <CreateHolidayModal isOpen={isCreateHolidayOpen} onClose={() => setIsCreateHolidayOpen(false)} onSubmit={async (holiday) => { await createHoliday(holiday); }} isSubmitting={isHolidaySubmitting} />
  </>;
}
