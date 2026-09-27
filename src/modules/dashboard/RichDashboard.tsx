import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { getAttendanceLocationLabel, getTodayAttendanceState, useAttendance, type AttendanceUiState } from '../../hooks/useAttendance';
import { useGeolocation } from '../../hooks/useGeolocation';
import { attendanceDateKey, formatAttendanceDate } from '../../utils/attendanceDate';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import CreateHolidayModal from '../../components/holidays/CreateHolidayModal';
import { useHolidays } from '../../hooks/useHolidays';

type Props = { role: string };

type Metric = { label: string; value: string | number; detail?: string; icon: typeof Users; tone?: 'blue' | 'green' | 'amber' | 'slate'; featured?: ReactNode };

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
  if (metric.featured) return <div className="col-span-full xl:col-span-2">{metric.featured}</div>;

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

const toBusinessDateKey = (value: Date) => `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;

const addBusinessDays = (value: string, delta: number) => {
  const [year, month, day] = value.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + delta);
  return toBusinessDateKey(base);
};

const displayAttendanceDateLabel = (value: string) => {
  const todayKey = todayBusinessDateKey();
  const yesterdayKey = addBusinessDays(todayKey, -1);
  if (value === todayKey) return 'Today';
  if (value === yesterdayKey) return 'Yesterday';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const DashboardAttendanceAction = ({
  state,
  isLoading,
  isGeoLoading,
  error,
  actionError,
  onPunchIn,
  onPunchOut,
}: {
  state: AttendanceUiState;
  isLoading: boolean;
  isGeoLoading: boolean;
  error: string | null;
  actionError: string | null;
  onPunchIn: () => void;
  onPunchOut: () => void;
}) => {
  const isUnavailable = Boolean(error);
  const isDisabled = isLoading || isGeoLoading || isUnavailable || state === 'LEAVE' || state === 'COMPLETED';
  const label = isUnavailable
    ? 'Unavailable'
    : state === 'LEAVE'
      ? 'On leave'
      : state === 'IN_PROGRESS'
        ? 'Check Out'
        : state === 'COMPLETED'
          ? 'Completed'
          : isGeoLoading || isLoading
            ? 'Checking...'
            : 'Check In';

  return (
    <div className="pt-2">
      <button
        type="button"
        disabled={isDisabled}
        onClick={state === 'IN_PROGRESS' ? onPunchOut : onPunchIn}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#c39a4a] bg-[#b08a3e] px-5 py-3 text-sm font-bold text-[#062b42] shadow-[0_8px_20px_rgba(176,138,62,0.22)] transition-colors duration-200 hover:bg-[#c39a4a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      {(error || actionError) && <p className="mt-2 text-xs text-[#c85d51]">{actionError || error}</p>}
    </div>
  );
};

const DashboardAttendanceSection = ({
  state,
  isLoading,
  isGeoLoading,
  error,
  actionError,
  status,
  punchInTime,
  punchOutTime,
  totalHours,
  locationStatus,
  onPunchIn,
  onPunchOut,
  onOpenAttendance,
}: {
  state: AttendanceUiState;
  isLoading: boolean;
  isGeoLoading: boolean;
  error: string | null;
  actionError: string | null;
  status?: string | null;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  totalHours?: number | null;
  locationStatus?: string | null;
  onPunchIn: () => void;
  onPunchOut: () => void;
  onOpenAttendance?: () => void;
}) => (
  <section className="overflow-hidden rounded-2xl border border-[#174e68] bg-gradient-to-br from-[#022337] via-[#073b5c] to-[#0d526b] text-white shadow-[0_18px_42px_rgba(2,35,55,0.2)]">
    <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-[#b08a3e]/50 bg-[#b08a3e]/15 p-3 text-[#d8b76a]"><Clock3 className="h-7 w-7" aria-hidden="true" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d8b76a]">Live attendance</p>
            <h2 className="mt-1 text-xl font-bold">Today's Attendance</h2>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div><p className="text-[#b8d0d5]">Status</p><p className="mt-1 font-semibold text-white">{statusLabel(status)}</p></div>
          <div><p className="text-[#b8d0d5]">Clock in</p><p className="mt-1 font-semibold text-white">{displayTime(punchInTime)}</p></div>
          <div><p className="text-[#b8d0d5]">Clock out</p><p className="mt-1 font-semibold text-white">{displayTime(punchOutTime)}</p></div>
          <div><p className="text-[#b8d0d5]">Location</p><p className="mt-1 font-semibold text-white">{locationStatus || 'Not recorded'}</p></div>
        </div>
        <p className="mt-4 text-xs text-[#d5e6e8]">Worked hours: {totalHours ?? 'Not recorded'}</p>
      </div>
      <div className="w-full shrink-0 lg:w-56">
        <DashboardAttendanceAction state={state} isLoading={isLoading} isGeoLoading={isGeoLoading} error={error} actionError={actionError} onPunchIn={onPunchIn} onPunchOut={onPunchOut} />
        {onOpenAttendance && <button type="button" onClick={onOpenAttendance} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#8fb2bd] bg-[#fffdfb] px-4 py-3 text-sm font-semibold text-[#073b5c] transition-colors hover:bg-[#edf3f5]">Open attendance <ArrowRight className="h-4 w-4" /></button>}
      </div>
    </div>
  </section>
);

const TodayEmployeeAttendance = ({ records, employees, visible, selectedDate, onPrevious, onNext }: { records: AttendanceRecord[]; employees: any[]; visible: boolean; selectedDate: string; onPrevious: () => void; onNext: () => void; }) => {
  if (!visible) return null;

  const todayKey = todayBusinessDateKey();
  const selectedRecords = records.filter((record) => attendanceDateKey(record.date ?? '') === selectedDate);
  const rows = employees
    .map((employee) => ({ employee, record: selectedRecords.find((record) => Number(record.employeeId ?? record.employee?.id) === Number(employee.id)) }))
    .filter(({ record }) => Boolean(record));

  const action = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrevious} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce6e8] bg-white text-[#073b5c] transition hover:border-[#b8ccd0] hover:bg-[#f6faf9] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous day" title="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[86px] text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#073b5c]">{displayAttendanceDateLabel(selectedDate)}</span>
      <button type="button" onClick={onNext} disabled={selectedDate >= todayKey} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce6e8] bg-white text-[#073b5c] transition hover:border-[#b8ccd0] hover:bg-[#f6faf9] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next day" title="Next day">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return <Section title="Employee Attendance" eyebrow={formatAttendanceDate(selectedDate)} action={action}>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Employee Name</th><th className="px-5 py-3">Check-In Time</th><th className="px-5 py-3">Check-Out Time</th><th className="px-5 py-3">Location</th></tr></thead><tbody>{rows.length ? rows.map(({ employee, record }) => { const location = getAttendanceLocationLabel(record?.punchInLocationStatus, record?.punchOutLocationStatus); return <tr key={employee.id} className="border-t border-slate-100"><td className="px-5 py-3">{formatAttendanceDate(selectedDate)}</td><td className="px-5 py-3 font-medium text-slate-800">{`${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || employee.name || employee.empCode || 'Unknown'}</td><td className="px-5 py-3">{displayTime(record?.punchIn)}</td><td className="px-5 py-3">{displayTime(record?.punchOut)}</td><td className="px-5 py-3">{location}</td></tr>; }) : <tr><td colSpan={5}><EmptyState message="No attendance records for the selected date." /></td></tr>}</tbody></table></div>
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

function useCompanionData(role: string, employeeMode: boolean, selectedDate: string) {
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
      loads.push(ApiService.getAttendance(selectedDate).then((result) => { if (active) setOrganizationAttendance(result ?? []); }).catch(() => undefined));
      loads.push(ApiService.getAttendanceEmployees().then((result) => { if (active) setOrganizationEmployees(result.data ?? []); }).catch(() => undefined));
      loads.push(ApiService.getHelpdeskTickets().then((result) => { if (active) setHelpdesk(result ?? []); }).catch(() => undefined));
    }
    Promise.all(loads);
    return () => { active = false; };
  }, [employeeMode, role, selectedDate]);

  return { attendance, organizationAttendance, organizationEmployees, holidays, assets, helpdesk };
}

export default function RichDashboard({ role }: Props) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const setIsRunPayrollOpen = () => navigate('/payroll');
  const [isCreateHolidayOpen, setIsCreateHolidayOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { createHoliday, isSubmitting: isHolidaySubmitting } = useHolidays();
  const {
    todayRecord,
    todayError,
    isLoading: attendanceLoading,
    punchIn,
    punchOut,
  } = useAttendance();
  const { requestLocation, isLoading: isGeoLoading, error: geoError } = useGeolocation();
  const [isAttendanceSubmitting, setIsAttendanceSubmitting] = useState(false);
  const employeeMode = role === 'EMPLOYEE';
  const todayKey = todayBusinessDateKey();
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(todayKey);
  const { attendance, organizationAttendance, organizationEmployees, holidays, assets, helpdesk } = useCompanionData(role, employeeMode, selectedAttendanceDate);

  const todayAttendanceState = getTodayAttendanceState(todayRecord);
  const handleDashboardPunch = async (action: 'in' | 'out') => {
    if (isAttendanceSubmitting || attendanceLoading || isGeoLoading || todayError || todayAttendanceState === 'LEAVE' || todayAttendanceState === 'COMPLETED') return;

    setIsAttendanceSubmitting(true);
    setActionError(null);
    try {
      const coordinates = await requestLocation();
      if (!coordinates) {
        setActionError(geoError?.message || 'Failed to get location');
        return;
      }

      if (action === 'in') {
        await punchIn(coordinates.latitude, coordinates.longitude);
      } else {
        await punchOut(coordinates.latitude, coordinates.longitude);
      }
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : `Punch ${action} failed`);
    } finally {
      setIsAttendanceSubmitting(false);
    }
  };

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
    const leaveBalanceEntries = dashboard.leaveBalance ?? [];
    const combinedMonthlyLeave = leaveBalanceEntries.find((item: any) => ['Casual Leave', 'Sick Leave'].includes(item.leaveType));
    const balance = Number(combinedMonthlyLeave?.remaining ?? leaveBalanceEntries.reduce((total: number, item: any) => total + Number(item.remaining ?? 0), 0));
    const upcomingHolidays = holidays.filter((holiday) => new Date(holiday.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, 4);
    const activeWfh = (dashboard.wfh ?? []).slice(0, 5);
    const latestPayroll = dashboard.payroll;
    const metrics: Metric[] = [
      { label: 'Leave balance', value: `${balance} days`, detail: 'Across available leave types', icon: CalendarDays, tone: 'blue' },
      { label: 'Present this month', value: month.presentDays ?? 0, detail: `${month.halfDays ?? 0} half days`, icon: CheckCircle2, tone: 'green' },
      { label: 'Pending requests', value: dashboard.pendingLeaveRequests ?? 0, detail: `${activeWfh.filter((item: any) => item.status === 'PENDING').length} WFH pending`, icon: Clock3, tone: 'amber' },
      { label: 'Latest payroll', value: latestPayroll ? 'Available' : 'No record', detail: latestPayroll ? `${latestPayroll.month}/${latestPayroll.year}` : 'No payslip generated', icon: FileText, tone: 'slate' },
      { label: "Today's attendance", value: '', icon: Clock3, featured: <DashboardAttendanceSection state={todayAttendanceState} isLoading={isAttendanceSubmitting || attendanceLoading} isGeoLoading={isGeoLoading} error={todayError} actionError={actionError} status={todayRecord?.status ?? dashboard.today?.status} punchInTime={todayRecord?.punchInTime ?? dashboard.today?.punchInTime} punchOutTime={todayRecord?.punchOutTime ?? dashboard.today?.punchOutTime} totalHours={todayRecord?.totalHours ?? dashboard.today?.totalHours} locationStatus={todayRecord?.locationStatus ?? dashboard.today?.locationStatus} onPunchIn={() => void handleDashboardPunch('in')} onPunchOut={() => void handleDashboardPunch('out')} /> },
    ];
    return <div className="space-y-7">
      <header className="dashboard-hero relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#022337] via-[#073b5c] to-[#0d526b] px-6 py-7 text-white shadow-[0_20px_48px_rgba(2,35,55,0.22)] sm:px-8"><div className="dashboard-hero__light" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#b8d0d5]">{dateText}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Good to see you, {name}</h1><p className="mt-2 text-sm text-[#d5e6e8]">{employee?.designation || 'Employee'}{employee?.department ? ` · ${employee.department}` : ''}</p></div><div className="rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-[#e5f0f0]">{statusLabel(dashboard.today?.status)}</div></div></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
      <Section title="Weekly working hours" eyebrow="Attendance overview"><div className="px-5 pb-5"><WeeklyHours records={attendance} /></div></Section>
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
    return <div className="space-y-7"><header className="rounded-xl bg-slate-950 px-6 py-7 text-white"><p className="text-sm text-slate-300">{dateText}</p><h1 className="mt-2 text-3xl font-semibold">Finance operations</h1><p className="mt-2 text-sm text-slate-300">Payroll status and totals from the current records.</p></header><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><DashboardAttendanceSection state={todayAttendanceState} isLoading={isAttendanceSubmitting || attendanceLoading} isGeoLoading={isGeoLoading} error={todayError} actionError={actionError} status={todayRecord?.status} punchInTime={todayRecord?.punchInTime} punchOutTime={todayRecord?.punchOutTime} totalHours={todayRecord?.totalHours} locationStatus={todayRecord?.locationStatus} onPunchIn={() => void handleDashboardPunch('in')} onPunchOut={() => void handleDashboardPunch('out')} /><Section title="Pending leave requests" eyebrow="Requests requiring review"><div className="divide-y divide-slate-100">{pendingLeaves.length ? pendingLeaves.slice(0, 5).map((leave: any) => <div key={leave.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span className="font-medium text-slate-800">{`${leave.employee?.firstName ?? ''} ${leave.employee?.lastName ?? ''}`.trim() || 'Employee'}</span><span className="text-slate-500">{statusLabel(leave.status)}</span></div>) : <EmptyState message="No pending leave requests." />}</div></Section><Section title="Payroll totals" eyebrow="Persisted payroll data"><div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">Gross total</p><p className="mt-2 text-2xl font-semibold text-slate-950">{payroll.grossTotal ?? 0}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Net total</p><p className="mt-2 text-2xl font-semibold text-slate-950">{payroll.netTotal ?? 0}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">LOP days</p><p className="mt-2 text-2xl font-semibold text-slate-950">{payroll.lopDays ?? 0}</p></div></div></Section></div>;
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
    { label: 'Today\'s attendance', value: '', icon: Clock3, featured: <DashboardAttendanceSection state={todayAttendanceState} isLoading={isAttendanceSubmitting || attendanceLoading} isGeoLoading={isGeoLoading} error={todayError} actionError={actionError} status={todayRecord?.status} punchInTime={todayRecord?.punchInTime} punchOutTime={todayRecord?.punchOutTime} totalHours={todayRecord?.totalHours} locationStatus={todayRecord?.locationStatus} onPunchIn={() => void handleDashboardPunch('in')} onPunchOut={() => void handleDashboardPunch('out')} /> },
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
    <TodayEmployeeAttendance
      records={organizationAttendance}
      employees={organizationEmployees}
      visible={isOrg}
      selectedDate={selectedAttendanceDate}
      onPrevious={() => setSelectedAttendanceDate((current) => addBusinessDays(current, -1))}
      onNext={() => setSelectedAttendanceDate((current) => {
        const next = addBusinessDays(current, 1);
        return next <= todayKey ? next : current;
      })}
    />
    <CreateEmployeeModal isOpen={isCreateEmployeeOpen} onClose={() => setIsCreateEmployeeOpen(false)} onSuccess={() => undefined} />
    <CreateHolidayModal isOpen={isCreateHolidayOpen} onClose={() => setIsCreateHolidayOpen(false)} onSubmit={async (holiday) => { await createHoliday(holiday); }} isSubmitting={isHolidaySubmitting} />
  </>;
}
