import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Home,
  Laptop,
  LifeBuoy,
  LogIn,
  LogOut,
  MapPin,
  Network,
  Timer,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import ApiService from '../../services/api';
import { getAttendanceLocationLabel, getTodayAttendanceState, useAttendance, type AttendanceUiState } from '../../hooks/useAttendance';
import { useGeolocation } from '../../hooks/useGeolocation';
import { attendanceDateKey, formatAttendanceDate, formatWorkedHours } from '../../utils/attendanceDate';
import { Avatar } from '../../components/ui/components';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import CreateHolidayModal from '../../components/holidays/CreateHolidayModal';
import { RunPayrollModal } from '../../components/payroll/RunPayrollModal';
import { AssignSalaryModal } from '../../components/payroll/AssignSalaryModal';
import { useHolidays } from '../../hooks/useHolidays';
import { HOLIDAY_MANAGEMENT_ROLES } from '../holidays/holidays-roles';
import { REPORTS_ROLES } from '../reports/reports-roles';
import { CHART_COLORS, ComparisonBarChart, DonutChart, STATUS_COLORS, TrendLineChart, WorkedHoursTrend, type DonutSlice } from './DashboardCharts';

type Props = { role: string; userName?: string };

type Tone = 'blue' | 'green' | 'amber' | 'slate' | 'rose';
type Metric = { label: string; value: string | number; detail?: string; icon: typeof Users; tone?: Tone };

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

type QuickAction = { label: string; icon: typeof Users; onClick: () => void; description?: string };
type PayrollRecord = { month: number; year: number; status: string; netSalary?: number; grossSalary?: number };

const toneClasses: Record<Tone, { icon: string; accent: string }> = {
  blue: { icon: 'border-[#cce1e8] bg-[#eaf3f7] text-[#1e627d]', accent: 'bg-[#24599a]' },
  green: { icon: 'border-[#c8ead9] bg-[#eaf7f1] text-[#19704b]', accent: 'bg-[#2e8b6a]' },
  amber: { icon: 'border-[#f0ddb1] bg-[#fff7e7] text-[#8b641b]', accent: 'bg-[#c9952b]' },
  slate: { icon: 'border-[#d5e1e3] bg-[#edf3f5] text-[#486271]', accent: 'bg-[#9fb2ba]' },
  rose: { icon: 'border-[#f3d3cf] bg-[#fff1ef] text-[#a63e35]', accent: 'bg-[#c8503f]' },
};

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORG_ROLES = ['SUPER_ADMIN', 'CEO', 'HR'];
const MANAGER_ROLES = ['IT_MANAGER', 'SALES_MANAGER'];
const TREND_DAYS = 7;

const ROLE_ACRONYMS = new Set(['HR', 'CEO', 'IT']);
const formatRole = (role: string) => role.split('_').map((word) => ROLE_ACRONYMS.has(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
const displayDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable';
const displayTime = (value?: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not recorded';
const statusLabel = (value?: string | null) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) : 'Not started';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const formatCompactCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
const employeeName = (employee?: { firstName?: string; lastName?: string; name?: string; empCode?: string } | null) =>
  `${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`.trim() || employee?.name || employee?.empCode || 'Employee';
const recordEmployeeId = (record: AttendanceRecord) => Number(record.employeeId ?? record.employee?.id);

const greeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const statusBadgeClass = (status?: string | null) => {
  switch (status) {
    case 'PRESENT':
    case 'COMPLETED':
      return 'border-[#c8ead9] bg-[#eaf7f1] text-[#19704b]';
    case 'LATE':
      return 'border-[#f0ddb1] bg-[#fff7e7] text-[#8b641b]';
    case 'HALF_DAY':
    case 'IN_PROGRESS':
      return 'border-[#cce1e8] bg-[#eaf3f7] text-[#1e627d]';
    case 'LEAVE':
      return 'border-[#d3dcef] bg-[#eef2fa] text-[#24599a]';
    case 'ABSENT':
      return 'border-[#f3d3cf] bg-[#fff1ef] text-[#a63e35]';
    default:
      return 'border-[#e1e8ea] bg-slate-50 text-slate-600';
  }
};

const StatusBadge = ({ status }: { status?: string | null }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {status ? statusLabel(status) : 'Non-working day'}
  </span>
);

/* ------------------------------ KPI cards ------------------------------ */
const MetricCard = ({ metric }: { metric: Metric }) => {
  const Icon = metric.icon;
  const tone = toneClasses[metric.tone ?? 'slate'];
  return (
    <div className="dashboard-metric kpi-card relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dce6e8] bg-white p-5 shadow-[0_8px_24px_rgba(7,59,92,0.06)] transition-shadow duration-200 hover:shadow-[0_12px_30px_rgba(7,59,92,0.1)]">
      <span className={`absolute inset-x-0 top-0 h-1 ${tone.accent}`} aria-hidden="true" />
      <div className="flex min-w-0 items-start gap-3">
        <span className={`shrink-0 rounded-xl border p-2.5 ${tone.icon}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <p className="kpi-card__label min-w-0 flex-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#617984]">{metric.label}</p>
      </div>
      <p className="kpi-card__value mt-3 font-bold text-[#073b5c]">{metric.value}</p>
      {metric.detail && <p className="mt-1 break-words text-xs leading-5 text-[#617984]">{metric.detail}</p>}
    </div>
  );
};

const MetricGrid = ({ metrics }: { metrics: Metric[] }) => (
  <div className="kpi-grid">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
);

/* ------------------------------ Layout blocks ------------------------------ */
const Section = ({ title, eyebrow, action, children, className = '' }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`dashboard-section flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dce6e8] bg-white shadow-[0_8px_24px_rgba(7,59,92,0.06)] ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ecec] px-5 py-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78909a]">{eyebrow}</p>}
        <h2 className="mt-0.5 text-base font-bold text-[#073b5c]">{title}</h2>
      </div>
      {action}
    </div>
    <div className="min-w-0 flex-1">{children}</div>
  </section>
);

const SectionHeading = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex items-end justify-between gap-3 pt-2">
    <div>
      <h2 className="text-lg font-bold tracking-tight text-[#073b5c]">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-[#78909a]">{description}</p>}
    </div>
  </div>
);

const SectionLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#1e627d] transition-colors hover:text-[#073b5c]">
    {label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
  </button>
);

const EmptyState = ({ message }: { message: string }) => <div className="flex min-h-28 items-center justify-center px-5 py-6 text-center text-sm text-[#78909a]">{message}</div>;

/* Secondary scope figures: small label-over-value pairs, deliberately quieter than the name */
const HeroStat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8aa0aa]">{label}</dt>
    <dd className="mt-0.5 text-sm font-bold tabular-nums text-[#23465b]">{value}</dd>
  </div>
);

const DashboardHeader = ({ dateText, name, roleLabel, subtitle, stats }: { dateText: string; name: string; roleLabel: string; subtitle?: string; stats?: Array<{ label: string; value: ReactNode }> }) => (
  <header className="dashboard-hero flex min-w-0 flex-col justify-center gap-5 p-5 sm:p-6">
    <div className="flex min-w-0 items-center gap-4">
      <Avatar name={name} size="lg" className="ring-4 ring-[#eaf3f7]" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b08a3e]">{greeting(new Date())} · {dateText}</p>
        <h1 className="mt-1 break-words text-xl font-bold leading-tight tracking-tight text-[#073b5c] sm:text-2xl">Welcome, {name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#617984]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce1e8] bg-[#eaf3f7] px-2.5 py-0.5 font-bold text-[#1e627d]"><BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />{roleLabel}</span>
          {subtitle ? <span className="inline-flex min-w-0 items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0 text-[#9fb2ba]" aria-hidden="true" /><span className="break-words">{subtitle}</span></span> : null}
        </div>
      </div>
    </div>
    {stats && stats.length > 0 && (
      <dl className="grid grid-cols-3 gap-3 border-t border-[#eef3f3] pt-4">
        {stats.map((stat) => <HeroStat key={stat.label} {...stat} />)}
      </dl>
    )}
  </header>
);

/* One coherent header card: compact profile on the left, the attendance action panel
   (slightly wider, the primary task) on the right; stacks until both halves have room. */
const HeroRow = ({ header, attendance }: { header: ReactNode; attendance: ReactNode }) => (
  <div className="dashboard-top grid min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-[#dce6e8] bg-white shadow-[0_10px_28px_rgba(7,59,92,0.08)] min-[1360px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">{header}{attendance}</div>
);

/* ------------------------------ Date helpers ------------------------------ */
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

const trendWindow = (todayKey: string) => Array.from({ length: TREND_DAYS }, (_, index) => addBusinessDays(todayKey, index - (TREND_DAYS - 1)));

const shortDayLabel = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
};

const displayAttendanceDateLabel = (value: string) => {
  const todayKey = todayBusinessDateKey();
  const yesterdayKey = addBusinessDays(todayKey, -1);
  if (value === todayKey) return 'Today';
  if (value === yesterdayKey) return 'Yesterday';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

/* Display-only tally of recorded statuses (no attendance rules are re-derived here). */
const tallyStatuses = (statuses: Array<string | null | undefined>) => statuses.reduce((counts, status) => {
  if (status === 'PRESENT' || status === 'LATE' || status === 'IN_PROGRESS' || status === 'COMPLETED') counts.present += 1;
  if (status === 'LATE') counts.late += 1;
  if (status === 'HALF_DAY') counts.halfDay += 1;
  if (status === 'LEAVE') counts.leave += 1;
  if (status === 'ABSENT') counts.absent += 1;
  return counts;
}, { present: 0, late: 0, halfDay: 0, leave: 0, absent: 0 });

const buildTrend = (days: string[], recordsByDay: (day: string) => AttendanceRecord[]) => days.map((day) => {
  const counts = tallyStatuses(recordsByDay(day).map((record) => record.status));
  return { day: shortDayLabel(day), Present: counts.present, Late: counts.late, 'Half day': counts.halfDay, Leave: counts.leave };
});

const TREND_SERIES = [
  { key: 'Present', label: 'Present', color: STATUS_COLORS.present },
  { key: 'Late', label: 'Late', color: STATUS_COLORS.late },
  { key: 'Half day', label: 'Half day', color: STATUS_COLORS.halfDay },
  { key: 'Leave', label: 'Leave', color: STATUS_COLORS.leave },
];

/* ------------------------------ Attendance widget ------------------------------ */
const useNow = (active: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
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
  const ActionIcon = state === 'IN_PROGRESS' ? LogOut : state === 'COMPLETED' ? CheckCircle2 : state === 'LEAVE' ? CalendarDays : LogIn;
  const style = state === 'IN_PROGRESS'
    ? 'border-white/30 bg-white text-[#073b5c] hover:bg-[#f6faf9]'
    : 'border-[#c39a4a] bg-[#b08a3e] text-[#062b42] hover:bg-[#c39a4a] shadow-[0_8px_20px_rgba(176,138,62,0.28)]';

  return (
    <div>
      <button
        type="button"
        disabled={isDisabled}
        onClick={state === 'IN_PROGRESS' ? onPunchOut : onPunchIn}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${style}`}
      >
        <ActionIcon className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      {(error || actionError) && <p role="alert" className="mt-2 text-xs text-[#ffb4a9]">{actionError || error}</p>}
    </div>
  );
};

const ATTENDANCE_STATE_COPY: Record<AttendanceUiState, { label: string; hint: string; pill: string }> = {
  NOT_CHECKED_IN: { label: 'Not checked in', hint: 'Check in to start your working day.', pill: 'border-white/25 bg-white/10 text-[#e3eef0]' },
  IN_PROGRESS: { label: 'Checked in', hint: 'Your working hours are being recorded.', pill: 'border-[#7fd1ad]/40 bg-[#2e8b6a]/25 text-[#bff0d9]' },
  COMPLETED: { label: 'Day completed', hint: 'Check-in and check-out are recorded for today.', pill: 'border-[#d8b76a]/45 bg-[#b08a3e]/20 text-[#f3dca4]' },
  LEAVE: { label: 'On leave', hint: 'You are on approved leave today.', pill: 'border-[#9ec1ff]/40 bg-[#24599a]/30 text-[#d4e3ff]' },
};

const AttendanceFact = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: ReactNode }) => (
  <div className="min-w-0 px-3 py-3 first:pl-0 max-[419px]:px-0">
    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a9c6cc]"><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{label}</p>
    <p className="mt-1 break-words text-sm font-bold tabular-nums text-white">{value}</p>
  </div>
);

export const DashboardAttendanceSection = ({
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
}) => {
  const isLive = state === 'IN_PROGRESS' && Boolean(punchInTime);
  const now = useNow(isLive);
  const copy = ATTENDANCE_STATE_COPY[state] ?? ATTENDANCE_STATE_COPY.NOT_CHECKED_IN;
  // Display-only elapsed time since the recorded check-in; the stored total comes from the backend at check-out
  const elapsedHours = isLive ? Math.max(0, (now - new Date(punchInTime as string).getTime()) / 3_600_000) : null;
  const workedValue = elapsedHours !== null
    ? formatWorkedHours(elapsedHours)
    : totalHours === null || totalHours === undefined ? 'Not recorded' : formatWorkedHours(totalHours);

  return (
    <section aria-label="Today's attendance" className="relative min-w-0 overflow-hidden bg-gradient-to-br from-[#022337] via-[#073b5c] to-[#0d526b] text-white">
      <span className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#c3a25a]/15 blur-2xl" aria-hidden="true" />
      <div className="relative grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="shrink-0 rounded-lg border border-[#b08a3e]/50 bg-[#b08a3e]/15 p-2 text-[#d8b76a]"><Clock3 className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-base font-bold">Today's Attendance</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${copy.pill}`}>
              {state === 'IN_PROGRESS' && <span className="h-2 w-2 animate-pulse rounded-full bg-[#7fd1ad]" aria-hidden="true" />}
              {copy.label}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 border-y border-white/10 min-[420px]:grid-cols-3 min-[420px]:divide-x min-[420px]:divide-white/10">
            <AttendanceFact icon={LogIn} label="Check-in" value={displayTime(punchInTime)} />
            <AttendanceFact icon={LogOut} label="Check-out" value={displayTime(punchOutTime)} />
            <AttendanceFact icon={MapPin} label="Location" value={locationStatus || 'Not recorded'} />
          </div>

          <p className="mt-3 text-xs text-[#a9c6cc]">
            {copy.hint}{status ? <span className="text-[#d5e6e8]"> · Status: {statusLabel(status)}</span> : null}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 md:border-l md:border-white/10 md:pl-4">
          <div className="flex items-center gap-2 text-[#d5e6e8]">
            <Timer className="h-4 w-4 shrink-0 text-[#d8b76a]" aria-hidden="true" />
            <p className="text-[13px] font-semibold tabular-nums">{elapsedHours !== null ? `Worked so far: ${workedValue}` : `Worked hours: ${workedValue}`}</p>
          </div>
          <DashboardAttendanceAction state={state} isLoading={isLoading} isGeoLoading={isGeoLoading} error={error} actionError={actionError} onPunchIn={onPunchIn} onPunchOut={onPunchOut} />
          {onOpenAttendance && <button type="button" onClick={onOpenAttendance} className="text-center text-xs font-semibold text-[#d8b76a] transition-colors hover:text-white">View attendance history</button>}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ Attention & actions ------------------------------ */
const AttentionCard = ({ label, count, description, onClick }: { label: string; count: number; description: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-[#f0ddb1] bg-[#fffaf0] px-5 py-4 text-left transition hover:border-[#d8b76a] hover:shadow-[0_8px_20px_rgba(176,138,62,0.15)]">
    <span className="shrink-0 rounded-xl bg-[#fff1d6] p-2.5 text-[#8b641b]"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1">
      <span className="block text-2xl font-bold leading-none tabular-nums text-[#073b5c]">{count}</span>
      <span className="mt-1 block break-words text-sm font-semibold text-[#12354a]">{label}</span>
      <span className="block text-xs text-[#78909a]">{description}</span>
    </span>
    <ArrowRight className="h-4 w-4 shrink-0 text-[#b08a3e] transition group-hover:translate-x-0.5" aria-hidden="true" />
  </button>
);

const AttentionRow = ({ items }: { items: Array<{ label: string; count: number; description: string; onClick: () => void }> }) => {
  const open = items.filter((item) => item.count > 0);
  if (!open.length) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#c8ead9] bg-[#f3fbf7] px-5 py-4 text-sm text-[#19704b]">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> No pending approvals right now.
      </div>
    );
  }
  return <div className="dashboard-grid-3">{open.map((item) => <AttentionCard key={item.label} {...item} />)}</div>;
};

const ActionButton = ({ label, icon: Icon, onClick }: QuickAction) => (
  <button
    type="button"
    onClick={onClick}
    className="quick-action-button group flex min-w-0 items-center gap-3 rounded-xl border border-[#dce6e8] bg-white px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#c3a25a]/60 hover:bg-[#fffdf8] hover:shadow-[0_8px_18px_rgba(7,59,92,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e] focus-visible:ring-offset-2"
  >
    <span className="shrink-0 rounded-lg bg-[#eaf3f7] p-2 text-[#1e627d] transition-colors group-hover:bg-[#fff7e7] group-hover:text-[#b08a3e]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1 break-words text-sm font-semibold text-[#12354a]">{label}</span>
    <ArrowRight className="h-4 w-4 shrink-0 text-[#9fb2ba] transition-transform group-hover:translate-x-0.5 group-hover:text-[#b08a3e]" aria-hidden="true" />
  </button>
);

const QuickActionsSection = ({ actions, error }: { actions: QuickAction[]; error?: string | null }) => (
  <Section title="Quick actions" eyebrow="Frequently used">
    <div className="grid gap-3 p-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,13rem),1fr))]">
      {error && <p role="alert" className="col-span-full text-sm text-rose-700">{error}</p>}
      {actions.map((action) => <ActionButton key={action.label} {...action} />)}
    </div>
  </Section>
);

/* ------------------------------ Attendance tables ------------------------------ */
const DayToggle = ({ selectedDate, onSelect, onPrevious, onNext }: { selectedDate: string; onSelect: (value: string) => void; onPrevious?: () => void; onNext?: () => void }) => {
  const todayKey = todayBusinessDateKey();
  const yesterdayKey = addBusinessDays(todayKey, -1);
  const pill = (key: string, label: string) => (
    <button type="button" onClick={() => onSelect(key)} aria-pressed={selectedDate === key} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedDate === key ? 'bg-[#073b5c] text-white shadow-sm' : 'text-[#486271] hover:bg-[#edf3f5]'}`}>{label}</button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-[#dce6e8] bg-[#f6faf9] p-1">{pill(todayKey, 'Today')}{pill(yesterdayKey, 'Yesterday')}</div>
      {onPrevious && onNext && (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onPrevious} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce6e8] bg-white text-[#073b5c] transition hover:bg-[#f6faf9]" aria-label="Previous day" title="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[92px] text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#073b5c]">{displayAttendanceDateLabel(selectedDate)}</span>
          <button type="button" onClick={onNext} disabled={selectedDate >= todayKey} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce6e8] bg-white text-[#073b5c] transition hover:bg-[#f6faf9] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next day" title="Next day">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const TableHead = ({ columns }: { columns: string[] }) => (
  <thead className="sticky top-0 z-[1] bg-[#f6faf9] text-[11px] uppercase tracking-[0.1em] text-[#617984]"><tr>{columns.map((column) => <th key={column} scope="col" className="border-b border-[#e4ecec] px-5 py-3 font-semibold">{column}</th>)}</tr></thead>
);

const EmployeeCell = ({ name, meta }: { name: string; meta?: string }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Avatar name={name} size="sm" className="ring-1 ring-[#e4ecec]" />
    <div className="min-w-0">
      <p className="font-semibold text-[#12354a]">{name}</p>
      {meta && <p className="text-xs text-[#78909a]">{meta}</p>}
    </div>
  </div>
);

const StatusSummary = ({ statuses }: { statuses: Array<string | null | undefined> }) => {
  const counts = tallyStatuses(statuses);
  const chips = [
    { label: 'Present', value: counts.present, color: STATUS_COLORS.present },
    { label: 'Late', value: counts.late, color: STATUS_COLORS.late },
    { label: 'Half day', value: counts.halfDay, color: STATUS_COLORS.halfDay },
    { label: 'Leave', value: counts.leave, color: STATUS_COLORS.leave },
    { label: 'Absent', value: counts.absent, color: STATUS_COLORS.absent },
  ];
  return (
    <div className="flex flex-wrap gap-2 border-b border-[#eef3f3] bg-[#fbfdfd] px-5 py-3" aria-label="Status summary">
      {chips.map((chip) => (
        <span key={chip.label} className="inline-flex items-center gap-2 rounded-full border border-[#e4ecec] bg-white px-3 py-1 text-xs text-[#486271]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chip.color }} aria-hidden="true" />
          {chip.label}<span className="font-bold tabular-nums text-[#12354a]">{chip.value}</span>
        </span>
      ))}
    </div>
  );
};

type AttendanceRow = { key: number; name: string; meta?: string; status?: string | null; record?: AttendanceRecord };

const AttendanceRowsTable = ({ rows, emptyMessage }: { rows: AttendanceRow[]; emptyMessage: string }) => (
  <div className="max-h-[28rem] overflow-auto">
    <table className="dashboard-table w-full min-w-[44rem] text-left text-sm">
      <TableHead columns={['Employee', 'Status', 'Check-in', 'Check-out', 'Worked hours', 'Location']} />
      <tbody>
        {rows.length ? rows.map(({ key, name, meta, status, record }) => (
          <tr key={key} className="border-t border-[#eef3f3] transition-colors hover:bg-[#f9fbfb]">
            <td className="px-5 py-3"><EmployeeCell name={name} meta={meta} /></td>
            <td className="px-5 py-3"><StatusBadge status={status} /></td>
            <td className="px-5 py-3 tabular-nums text-[#486271]">{record ? displayTime(record.punchIn) : '—'}</td>
            <td className="px-5 py-3 tabular-nums text-[#486271]">{record ? displayTime(record.punchOut) : '—'}</td>
            <td className="px-5 py-3 tabular-nums text-[#486271]">{record?.punchOut ? formatWorkedHours(record.totalHours) : '—'}</td>
            <td className="px-5 py-3 text-[#486271]">{record ? getAttendanceLocationLabel(record.punchInLocationStatus, record.punchOutLocationStatus) : '—'}</td>
          </tr>
        )) : <tr><td colSpan={6}><EmptyState message={emptyMessage} /></td></tr>}
      </tbody>
    </table>
  </div>
);

/* ------------------------------ Pending lists ------------------------------ */
const PendingList = ({ title, items, emptyMessage, onViewAll, describe }: { title: string; items: any[]; emptyMessage: string; onViewAll: () => void; describe: (item: any) => string }) => (
  <Section title={title} eyebrow="Requires review" action={<SectionLink label="View all" onClick={onViewAll} />}>
    {items.length ? (
      <div className="divide-y divide-[#eef3f3]">
        {items.slice(0, 6).map((item) => {
          const name = item.employee ? employeeName(item.employee) : 'Employee request';
          return (
            <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={name} size="sm" className="ring-1 ring-[#e4ecec]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#12354a]">{name}</p>
                  <p className="mt-0.5 truncate text-xs text-[#78909a]">{describe(item)}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-[#f0ddb1] bg-[#fff7e7] px-2.5 py-0.5 text-xs font-semibold text-[#8b641b]">Pending</span>
            </div>
          );
        })}
      </div>
    ) : <EmptyState message={emptyMessage} />}
  </Section>
);

const MiniStat = ({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) => (
  <div className="min-w-0 rounded-xl border border-[#e4ecec] bg-[#f6faf9] p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#617984]">{label}</p>
    <p className="mt-2 break-words text-xl font-bold tabular-nums text-[#073b5c]">{value}</p>
    {detail && <p className="mt-0.5 text-xs text-[#78909a]">{detail}</p>}
  </div>
);

/* ------------------------------ Data loading ------------------------------ */
function useCompanionData(role: string, employeeMode: boolean) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scopeEmployees, setScopeEmployees] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [helpdesk, setHelpdesk] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    let active = true;
    const current = new Date();
    const loads: Promise<void>[] = [];
    if (employeeMode) {
      loads.push(ApiService.getMyAttendance(current.getMonth() + 1, current.getFullYear(), 1, 31).then((result) => { if (active) setAttendance(result.data ?? []); }).catch(() => undefined));
      loads.push(ApiService.getMyHolidays().then((result) => { if (active) setHolidays(result ?? []); }).catch(() => undefined));
      loads.push(ApiService.getMyAssets().then((result) => { if (active) setAssets(result ?? []); }).catch(() => undefined));
    }
    if (ORG_ROLES.includes(role)) {
      loads.push(ApiService.getHelpdeskTickets().then((result) => { if (active) setHelpdesk(result ?? []); }).catch(() => undefined));
      // Persisted payroll records (endpoint authorized for SUPER_ADMIN / CEO / HR)
      loads.push(Promise.resolve().then(() => ApiService.getPayroll()).then((result) => { if (active) setPayrolls((result ?? []) as PayrollRecord[]); }).catch(() => undefined));
    }
    // Employee names for the attendance tables; the backend scopes this list to the user's authorization
    if (ORG_ROLES.includes(role) || MANAGER_ROLES.includes(role)) {
      loads.push(ApiService.getAttendanceEmployees().then((result) => { if (active) setScopeEmployees(result.data ?? []); }).catch(() => undefined));
    }
    Promise.all(loads);
    return () => { active = false; };
  }, [employeeMode, role]);

  return { attendance, scopeEmployees, holidays, assets, helpdesk, payrolls };
}

/* Organization attendance by day from /attendance/all (SUPER_ADMIN / CEO / HR only).
   Each day is requested once and cached: the 7-day trend and the Today/Yesterday table share it. */
function useOrganizationAttendance(role: string, todayKey: string, selectedDate: string) {
  const [byDay, setByDay] = useState<Record<string, AttendanceRecord[]>>({});
  const [loadedDays, setLoadedDays] = useState<Set<string>>(() => new Set());
  const enabled = ORG_ROLES.includes(role);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const days = trendWindow(todayKey);
    Promise.all(days.map((day) => ApiService.getAttendance(day).then((records) => [day, records ?? []] as const).catch(() => [day, null] as const))).then((results) => {
      if (!active) return;
      setByDay((current) => {
        const next = { ...current };
        results.forEach(([day, records]) => { if (records) next[day] = records; });
        return next;
      });
      setLoadedDays((current) => new Set([...current, ...results.filter(([, records]) => records).map(([day]) => day)]));
    });
    return () => { active = false; };
  }, [enabled, todayKey]);

  useEffect(() => {
    if (!enabled || trendWindow(todayKey).includes(selectedDate)) return undefined;
    let active = true;
    ApiService.getAttendance(selectedDate).then((records) => {
      if (!active) return;
      setByDay((current) => ({ ...current, [selectedDate]: records ?? [] }));
      setLoadedDays((current) => new Set([...current, selectedDate]));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [enabled, selectedDate, todayKey]);

  return { byDay, loadedDays };
}

/* Team attendance for managers: each authorized member's monthly records
   (the backend checks the manager may view each member). */
function useTeamAttendance(memberIds: number[], todayKey: string, enabled: boolean) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const memberKey = memberIds.join(',');

  useEffect(() => {
    if (!enabled || !memberIds.length) return undefined;
    let active = true;
    const months = [...new Set(trendWindow(todayKey).map((day) => day.slice(0, 7)))].map((value) => value.split('-').map(Number));
    const requests = memberIds.flatMap((id) => months.map(([year, month]) => Promise.resolve()
      .then(() => ApiService.getEmployeeAttendance(id, month, year, undefined, 1, 31))
      .then((result) => (result?.data ?? []).map((record: any) => ({ ...record, employeeId: Number(record.employeeId ?? id) })))
      .catch(() => [] as AttendanceRecord[])));
    Promise.all(requests).then((results) => {
      if (!active) return;
      setRecords(results.flat());
      setLoaded(true);
    });
    return () => { active = false; };
  }, [enabled, memberKey, todayKey]);

  return { records, loaded };
}

/* ================================ Dashboard ================================ */
export default function RichDashboard({ role, userName }: Props) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);
  const [isAssignSalaryOpen, setIsAssignSalaryOpen] = useState(false);
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
  const yesterdayKey = addBusinessDays(todayKey, -1);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(todayKey);
  const [teamSelectedDate, setTeamSelectedDate] = useState<string>(todayKey);
  const { attendance, scopeEmployees, holidays, assets, helpdesk, payrolls } = useCompanionData(role, employeeMode);
  const organization = useOrganizationAttendance(role, todayKey, selectedAttendanceDate);

  const dashboardRole = String(dashboard?.role ?? role);
  const isManagerView = MANAGER_ROLES.includes(dashboardRole);
  const teamMemberIds = useMemo<number[]>(
    () => (dashboard?.workforce?.byEmployee ?? []).map((row: any) => Number(row.employeeId)).filter((id: number) => Number.isInteger(id) && id > 0),
    [dashboard],
  );
  const team = useTeamAttendance(teamMemberIds, todayKey, isManagerView);

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

  // Daily worked hours for the employee's current month (real attendance records)
  const hoursTrend = useMemo(() => attendance
    .filter((record) => record.date && attendanceDateKey(record.date) <= todayKey)
    .sort((left, right) => attendanceDateKey(left.date ?? '').localeCompare(attendanceDateKey(right.date ?? '')))
    .map((record) => {
      const [, month, day] = attendanceDateKey(record.date ?? '').split('-').map(Number);
      return { label: `${day} ${MONTH_ABBREVIATIONS[(month || 1) - 1]}`, hours: Number(record.totalHours ?? 0) };
    }), [attendance, todayKey]);

  if (error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>;
  if (!dashboard) {
    return (
      <div role="status" className="space-y-6">
        <span className="sr-only">Loading your live dashboard...</span>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr]" aria-hidden="true">
          <div className="h-52 animate-pulse rounded-2xl bg-[#e6eeee]" />
          <div className="h-52 animate-pulse rounded-2xl bg-[#d7e3e6]" />
        </div>
        <div className="kpi-grid" aria-hidden="true">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-[#e6eeee]" />)}</div>
        <p className="text-center text-sm text-slate-500" aria-hidden="true">Loading your live dashboard...</p>
      </div>
    );
  }

  const today = new Date();
  const dateText = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const displayName = dashboard.employee ? employeeName(dashboard.employee) : (userName || formatRole(dashboardRole));
  const can = (roles: readonly string[]) => roles.includes(dashboardRole);

  const attendanceCard = (
    <DashboardAttendanceSection
      state={todayAttendanceState}
      isLoading={isAttendanceSubmitting || attendanceLoading}
      isGeoLoading={isGeoLoading}
      error={todayError}
      actionError={actionError}
      status={todayRecord?.status ?? dashboard.today?.status}
      punchInTime={todayRecord?.punchInTime ?? dashboard.today?.punchInTime}
      punchOutTime={todayRecord?.punchOutTime ?? dashboard.today?.punchOutTime}
      totalHours={todayRecord?.totalHours ?? dashboard.today?.totalHours}
      locationStatus={todayRecord?.locationStatus ?? dashboard.today?.locationStatus}
      onPunchIn={() => void handleDashboardPunch('in')}
      onPunchOut={() => void handleDashboardPunch('out')}
      onOpenAttendance={() => navigate('/attendance')}
    />
  );

  const exportAttendance = async () => {
    try {
      setActionError(null);
      const current = new Date();
      await ApiService.exportAttendance(current.getMonth() + 1, current.getFullYear());
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Failed to export attendance');
    }
  };

  /* Quick actions only for routes/actions the role is already authorized to use */
  const quickActions: QuickAction[] = [
    ...(can(['SUPER_ADMIN', 'CEO', 'HR']) ? [{ label: 'Add employee', icon: UserPlus, onClick: () => { setActionError(null); setIsCreateEmployeeOpen(true); } }] : []),
    ...(can(['SUPER_ADMIN', 'CEO', 'HR', 'FINANCE_MANAGER']) ? [
      { label: 'Generate payroll', icon: BriefcaseBusiness, onClick: () => { setActionError(null); setIsRunPayrollOpen(true); } },
      { label: 'Salary management', icon: Wallet, onClick: () => { setActionError(null); setIsAssignSalaryOpen(true); } },
      { label: 'Payroll', icon: FileText, onClick: () => navigate('/payroll') },
    ] : []),
    { label: can(['SUPER_ADMIN', 'CEO', 'HR']) ? 'Manage employees' : 'Employees', icon: Users, onClick: () => navigate('/employees') },
    { label: 'Attendance', icon: ClipboardCheck, onClick: () => navigate('/employee-attendance') },
    { label: 'Leave', icon: CalendarDays, onClick: () => navigate('/leave') },
    ...(can(['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER']) ? [{ label: 'WFH requests', icon: Home, onClick: () => navigate('/wfh') }] : []),
    { label: 'Teams', icon: Network, onClick: () => navigate('/team') },
    ...(can(REPORTS_ROLES) ? [{ label: 'Reports', icon: BarChart3, onClick: () => navigate('/reports') }] : []),
    ...(can(HOLIDAY_MANAGEMENT_ROLES) ? [{ label: 'Create holiday', icon: CalendarDays, onClick: () => { setActionError(null); setIsCreateHolidayOpen(true); } }] : []),
    ...(can(['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER']) ? [{ label: 'Export attendance', icon: Download, onClick: () => void exportAttendance() }] : []),
  ];

  const modals = (
    <>
      <CreateEmployeeModal isOpen={isCreateEmployeeOpen} onClose={() => setIsCreateEmployeeOpen(false)} onSuccess={() => undefined} />
      <CreateHolidayModal isOpen={isCreateHolidayOpen} onClose={() => setIsCreateHolidayOpen(false)} onSubmit={async (holiday) => { await createHoliday(holiday); }} isSubmitting={isHolidaySubmitting} />
      <RunPayrollModal isOpen={isRunPayrollOpen} onClose={() => setIsRunPayrollOpen(false)} onSuccess={() => undefined} />
      <AssignSalaryModal isOpen={isAssignSalaryOpen} onClose={() => setIsAssignSalaryOpen(false)} onSuccess={() => undefined} />
    </>
  );

  /* ---------------------------- EMPLOYEE ---------------------------- */
  if (employeeMode) {
    const month = dashboard.month ?? {};
    const leaveBalanceEntries: any[] = dashboard.leaveBalance ?? [];
    const combinedMonthlyLeave = leaveBalanceEntries.find((item: any) => ['Casual Leave', 'Sick Leave'].includes(item.leaveType));
    const balance = Number(combinedMonthlyLeave?.remaining ?? leaveBalanceEntries.reduce((total: number, item: any) => total + Number(item.remaining ?? 0), 0));
    const upcomingHolidays = holidays.filter((holiday) => new Date(holiday.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, 4);
    const activeWfh = (dashboard.wfh ?? []).slice(0, 5);
    const recentDecisions: any[] = (dashboard.recentLeaveDecisions ?? []).slice(0, 5);
    const latestPayroll = dashboard.payroll;
    // Only finalized/paid payroll counts as an available payslip
    const hasPayslip = latestPayroll && ['FINALIZED', 'PAID'].includes(latestPayroll.status);
    const recordedDays = Number(month.presentDays ?? 0) + Number(month.halfDays ?? 0) + Number(month.leaveDays ?? 0) + Number(month.absentDays ?? 0);
    const metrics: Metric[] = [
      { label: 'Present this month', value: month.presentDays ?? 0, detail: `${month.halfDays ?? 0} half days`, icon: CheckCircle2, tone: 'green' },
      { label: 'Leave balance', value: `${balance} days`, detail: 'Available to request', icon: CalendarDays, tone: 'blue' },
      { label: 'Pending requests', value: dashboard.pendingLeaveRequests ?? 0, detail: `${activeWfh.filter((item: any) => item.status === 'PENDING').length} WFH pending`, icon: Clock3, tone: 'amber' },
      { label: 'Latest payslip', value: hasPayslip ? `${MONTH_ABBREVIATIONS[latestPayroll.month - 1]} ${latestPayroll.year}` : 'None yet', detail: hasPayslip ? 'Ready to download' : 'No finalized payslip yet', icon: FileText, tone: 'slate' },
    ];
    const monthComposition: DonutSlice[] = [
      { name: 'Present', value: Number(month.presentDays ?? 0), color: STATUS_COLORS.present },
      { name: 'Half day', value: Number(month.halfDays ?? 0), color: STATUS_COLORS.halfDay },
      { name: 'Leave', value: Number(month.leaveDays ?? 0), color: STATUS_COLORS.leave },
      { name: 'Absent', value: Number(month.absentDays ?? 0), color: STATUS_COLORS.absent },
    ];
    const leaveBalanceChart = leaveBalanceEntries
      .filter((item) => Number(item.allocated ?? 0) > 0 || Number(item.used ?? 0) > 0)
      .map((item) => ({ type: item.leaveType, Used: Number(item.used ?? 0), Remaining: Number(item.remaining ?? 0) }));
    const employeeActions: QuickAction[] = [
      { label: 'View payslips', icon: FileText, onClick: () => navigate('/payroll') },
      { label: 'My attendance', icon: ClipboardCheck, onClick: () => navigate('/attendance') },
      { label: 'Request leave', icon: CalendarDays, onClick: () => navigate('/leave') },
      { label: 'Request work from home', icon: Home, onClick: () => navigate('/wfh') },
      { label: 'View performance', icon: BriefcaseBusiness, onClick: () => navigate('/performance') },
    ];

    return <div className="space-y-6">
      <HeroRow
        header={<DashboardHeader dateText={dateText} name={displayName} roleLabel="Employee" subtitle={dashboard.employee?.department || undefined} stats={[
          { label: 'Days recorded', value: recordedDays },
          { label: 'Leave available', value: `${balance} d` },
          { label: 'Pending leave', value: dashboard.pendingLeaveRequests ?? 0 },
        ]} />}
        attendance={attendanceCard}
      />
      <MetricGrid metrics={metrics} />
      <div className="dashboard-grid-2">
        <Section title="This month's attendance" eyebrow="Working days by status">
          <DonutChart data={monthComposition} centerLabel="Days" emptyMessage="No attendance recorded this month yet." valueSuffix="days" />
        </Section>
        <Section title="Daily working hours" eyebrow="This month" action={<SectionLink label="Attendance history" onClick={() => navigate('/attendance')} />}>
          <WorkedHoursTrend points={hoursTrend} emptyMessage="No attendance hours recorded for this period." />
        </Section>
      </div>
      <div className="dashboard-grid-2">
        <Section title="Leave balance" eyebrow="Current leave year" action={<SectionLink label="Request leave" onClick={() => navigate('/leave')} />}>
          <ComparisonBarChart data={leaveBalanceChart} xKey="type" series={[{ key: 'Used', label: 'Used', color: CHART_COLORS.gold }, { key: 'Remaining', label: 'Remaining', color: CHART_COLORS.blue }]} stacked emptyMessage="No leave balance available." />
        </Section>
        <Section title="Payslip" eyebrow="Latest payroll" action={<SectionLink label="All payslips" onClick={() => navigate('/payroll')} />}>
          {hasPayslip ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <MiniStat label="Pay period" value={`${MONTH_NAMES[latestPayroll.month - 1]} ${latestPayroll.year}`} detail={statusLabel(latestPayroll.status)} />
              <MiniStat label="Net pay" value={formatCurrency(latestPayroll.netSalary ?? 0)} detail={`Gross ${formatCurrency(latestPayroll.grossSalary ?? 0)}`} />
              <MiniStat label="Paid days" value={latestPayroll.presentDays ?? '—'} detail={`of ${latestPayroll.workingDays ?? '—'} working days`} />
              <MiniStat label="LOP days" value={latestPayroll.lopDays ?? 0} detail="Loss of pay" />
            </div>
          ) : <EmptyState message="Your payslip will appear here once payroll is finalized." />}
        </Section>
      </div>
      <QuickActionsSection actions={employeeActions} />
      <div className="dashboard-grid-3">
        <Section title="Recent leave decisions" eyebrow="Approved / rejected" action={<SectionLink label="Leave" onClick={() => navigate('/leave')} />}>
          {recentDecisions.length ? <div className="divide-y divide-[#eef3f3]">{recentDecisions.map((leave: any) => <div key={leave.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><div className="min-w-0"><p className="truncate font-medium text-[#12354a]">{leave.leaveType?.name || 'Leave'}</p><p className="mt-0.5 text-xs text-[#78909a]">{displayDate(leave.startDate)} · {leave.totalDays ?? 0} days</p></div><StatusBadge status={leave.status === 'APPROVED' ? 'PRESENT' : leave.status === 'REJECTED' ? 'ABSENT' : leave.status} /></div>)}</div> : <EmptyState message="No recent leave decisions." />}
        </Section>
        <Section title="WFH requests" eyebrow="Recent requests">{activeWfh.length ? <div className="divide-y divide-[#eef3f3]">{activeWfh.map((item: any) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><div className="min-w-0"><p className="font-medium text-[#12354a]">{displayDate(item.startDate)} - {displayDate(item.endDate)}</p><p className="mt-1 truncate text-xs text-[#78909a]">{item.reason || 'No reason provided'}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{statusLabel(item.status)}</span></div>)}</div> : <EmptyState message="No WFH requests yet." />}</Section>
        <Section title="Upcoming holidays" eyebrow="Calendar"><div className="divide-y divide-[#eef3f3]">{upcomingHolidays.length ? upcomingHolidays.map((holiday: any) => <div key={holiday.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#12354a]">{holiday.name}</p><p className="text-xs text-[#78909a]">{holiday.isOptional ? 'Optional holiday' : 'Company holiday'}</p></div><time className="shrink-0 text-sm font-semibold text-[#486271]">{displayDate(holiday.date)}</time></div>) : <EmptyState message="No upcoming holidays available." />}</div></Section>
      </div>
      {assets.length > 0 && (
        <Section title="My assets" eyebrow="Assigned to you"><div className="grid gap-px bg-[#eef3f3] sm:grid-cols-2 lg:grid-cols-3">{assets.slice(0, 6).map((asset: any) => <div key={asset.id} className="flex items-center gap-3 bg-white px-5 py-3"><span className="rounded-md bg-[#edf3f5] p-2 text-[#486271]"><Laptop className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-[#12354a]">{asset.name}</p><p className="text-xs text-[#78909a]">{statusLabel(asset.status)}</p></div></div>)}</div></Section>
      )}
    </div>;
  }

  /* ------------------------- FINANCE MANAGER ------------------------ */
  if (dashboardRole === 'FINANCE_MANAGER') {
    const payroll = dashboard.payroll ?? {};
    const kpis = dashboard.kpis ?? {};
    const metrics: Metric[] = [
      { label: 'Payroll population', value: kpis.payrollEmployeePopulation ?? 0, detail: `${kpis.activeEmployees ?? 0} active employees`, icon: Users, tone: 'blue' },
      { label: 'Draft payroll', value: kpis.draftPayrolls ?? 0, detail: 'Awaiting finalization', icon: FileText, tone: 'amber' },
      { label: 'Finalized payroll', value: kpis.finalizedPayrolls ?? 0, detail: 'Ready for payout', icon: CheckCircle2, tone: 'green' },
      { label: 'Paid payroll', value: kpis.paidPayrolls ?? 0, detail: 'Disbursed', icon: Wallet, tone: 'slate' },
    ];
    const payrollStatus: DonutSlice[] = [
      { name: 'Draft', value: Number(kpis.draftPayrolls ?? 0), color: CHART_COLORS.gold },
      { name: 'Finalized', value: Number(kpis.finalizedPayrolls ?? 0), color: CHART_COLORS.sky },
      { name: 'Paid', value: Number(kpis.paidPayrolls ?? 0), color: CHART_COLORS.green },
    ];
    const pendingLeaves = dashboard.pendingActions?.leave ?? [];

    return <>
      <div className="space-y-6">
        <HeroRow
          header={<DashboardHeader dateText={dateText} name={displayName} roleLabel="Finance Manager" subtitle="Payroll operations" stats={[
            { label: 'Active employees', value: kpis.activeEmployees ?? 0 },
            { label: 'Net payout', value: formatCompactCurrency(payroll.netTotal ?? 0) },
            { label: 'Pending leave', value: kpis.pendingLeaveRequests ?? 0 },
          ]} />}
          attendance={attendanceCard}
        />
        <MetricGrid metrics={metrics} />
        <AttentionRow items={[{ label: 'Pending leave requests', count: Number(kpis.pendingLeaveRequests ?? 0), description: 'Awaiting your review', onClick: () => navigate('/leave') }]} />
        <div className="dashboard-grid-2">
          <Section title="Payroll status" eyebrow="All payroll records">
            <DonutChart data={payrollStatus} centerLabel="Payrolls" emptyMessage="No payroll records yet." />
          </Section>
          <Section title="Payroll totals" eyebrow="Persisted payroll data">
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <MiniStat label="Gross total" value={formatCurrency(payroll.grossTotal ?? 0)} />
              <MiniStat label="Net total" value={formatCurrency(payroll.netTotal ?? 0)} />
              <MiniStat label="LOP days" value={payroll.lopDays ?? 0} />
            </div>
          </Section>
        </div>
        <QuickActionsSection actions={quickActions} error={actionError} />
        <PendingList title="Pending leave requests" items={pendingLeaves} emptyMessage="No pending leave requests." onViewAll={() => navigate('/leave')} describe={(leave) => `${leave.leaveType?.name || 'Leave'} · ${leave.totalDays ?? 0} days`} />
      </div>
      {modals}
    </>;
  }

  /* ------------------ SUPER_ADMIN / CEO / HR / MANAGERS ------------------ */
  const kpis = dashboard.kpis ?? {};
  const workforce = dashboard.workforce ?? {};
  const isOrg = ORG_ROLES.includes(dashboardRole);
  const isManager = isManagerView;
  const scopeCount = Number(dashboard.scope?.employeeCount ?? kpis.totalEmployees ?? 0);
  const presentToday = Number(kpis.presentToday ?? 0);
  const workingToday = presentToday + Number(kpis.halfDayToday ?? 0) + Number(kpis.onLeaveToday ?? 0) + Number(kpis.absentToday ?? 0);
  const attendanceRate = workingToday ? Math.round(((presentToday + Number(kpis.halfDayToday ?? 0)) / workingToday) * 100) : 0;
  const pendingLeaves: any[] = dashboard.pendingActions?.leave ?? [];
  const pendingWfh: any[] = dashboard.pendingActions?.wfh ?? [];
  const pendingTotal = pendingLeaves.length + pendingWfh.length + Number(kpis.pendingAttendanceRegularizations ?? 0);
  const departmentSummary: any[] = dashboard.departmentSummary ?? [];
  const byEmployee: Array<{ employeeId: number; department: string; status: string | null }> = workforce.byEmployee ?? [];
  const employeesById = new Map<number, any>(scopeEmployees.map((employee) => [Number(employee.id), employee]));
  const nameFor = (id: number, fallback?: AttendanceRecord['employee']) => {
    const employee = employeesById.get(id);
    if (employee) return employeeName(employee);
    return fallback && (fallback.firstName || fallback.name) ? employeeName(fallback) : `Employee #${id}`;
  };

  const totalEmployees = Number(kpis.totalEmployees ?? 0);
  const activeEmployees = Number(kpis.activeEmployees ?? 0);
  const metrics: Metric[] = [
    { label: isManager ? 'Team members' : 'Total employees', value: totalEmployees, detail: isManager ? 'In your authorized scope' : 'All employees in scope', icon: Users, tone: 'blue' },
    { label: 'Active employees', value: activeEmployees, detail: totalEmployees ? `${Math.round((activeEmployees / totalEmployees) * 100)}% of headcount` : 'No employees in scope', icon: UserCheck, tone: 'slate' },
    { label: 'Present today', value: presentToday, detail: workingToday ? `${attendanceRate}% attendance · ${kpis.lateToday ?? 0} late` : 'No working-day records', icon: CheckCircle2, tone: 'green' },
    { label: 'Absent today', value: kpis.absentToday ?? 0, detail: 'Working day, no check-in', icon: CircleSlash, tone: 'rose' },
    { label: 'On leave today', value: kpis.onLeaveToday ?? 0, detail: `${kpis.halfDayToday ?? 0} half day`, icon: CalendarDays, tone: 'amber' },
  ];

  const lateToday = Number(workforce.late ?? 0);
  const workforceComposition: DonutSlice[] = [
    { name: 'On time', value: Math.max(Number(workforce.present ?? 0) - lateToday, 0), color: STATUS_COLORS.present },
    { name: 'Late', value: lateToday, color: STATUS_COLORS.late },
    { name: 'Half day', value: Number(workforce.halfDay ?? 0), color: STATUS_COLORS.halfDay },
    { name: 'Leave', value: Number(workforce.leave ?? 0), color: STATUS_COLORS.leave },
    { name: 'Absent', value: Number(workforce.absent ?? 0), color: STATUS_COLORS.absent },
  ];
  const activeComposition: DonutSlice[] = [
    { name: 'Active', value: activeEmployees, color: CHART_COLORS.blue },
    { name: 'Not active', value: Math.max(totalEmployees - activeEmployees, 0), color: CHART_COLORS.slate },
  ];
  const departmentAttendance = departmentSummary.map((row) => ({ department: row.department, Present: row.presentToday, Leave: row.leaveToday, Absent: row.absentToday }));
  const departmentStrength = [...departmentSummary].sort((left, right) => right.employeeCount - left.employeeCount).map((row) => ({ department: row.department, Employees: row.employeeCount }));
  const pendingLeaveByType = Object.entries(pendingLeaves.reduce((counts: Record<string, number>, leave: any) => {
    const type = leave.leaveType?.name || 'Leave';
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {})).map(([type, count]) => ({ type, Requests: count as number }));

  // 7-day trend from recorded attendance (org: /attendance/all per day; manager: team members' monthly records)
  const trendDays = trendWindow(todayKey);
  const orgTrendReady = trendDays.every((day) => organization.loadedDays.has(day));
  const teamRecordsForDay = (day: string) => team.records.filter((record) => record.date && attendanceDateKey(record.date) === day);
  const attendanceTrend = isOrg
    ? (orgTrendReady ? buildTrend(trendDays, (day) => organization.byDay[day] ?? []) : [])
    : (team.loaded ? buildTrend(trendDays, teamRecordsForDay) : []);
  const trendHasData = attendanceTrend.some((point) => TREND_SERIES.some((series) => Number(point[series.key as keyof typeof point]) > 0));

  // Payroll overview from persisted payroll records (org roles only)
  const periodKey = (record: PayrollRecord) => record.year * 12 + (record.month - 1);
  const periods = [...new Set(payrolls.map(periodKey))].sort((left, right) => left - right);
  const latestPeriod = periods[periods.length - 1];
  const latestPayrolls = payrolls.filter((record) => periodKey(record) === latestPeriod);
  const latestPeriodLabel = latestPayrolls.length ? `${MONTH_NAMES[latestPayrolls[0].month - 1]} ${latestPayrolls[0].year}` : '';
  const payrollStatus: DonutSlice[] = [
    { name: 'Draft', value: latestPayrolls.filter((record) => record.status === 'DRAFT').length, color: CHART_COLORS.gold },
    { name: 'Finalized', value: latestPayrolls.filter((record) => record.status === 'FINALIZED').length, color: CHART_COLORS.sky },
    { name: 'Paid', value: latestPayrolls.filter((record) => record.status === 'PAID').length, color: CHART_COLORS.green },
  ];
  const payrollByPeriod = periods.slice(-6).map((period) => {
    const records = payrolls.filter((record) => periodKey(record) === period);
    return { period: `${MONTH_ABBREVIATIONS[period % 12]} ${String(Math.floor(period / 12)).slice(-2)}`, 'Net pay (₹)': Math.round(records.reduce((sum, record) => sum + Number(record.netSalary ?? 0), 0)) };
  });

  // Attendance table rows
  const orgRows = (): AttendanceRow[] => {
    const records = organization.byDay[selectedAttendanceDate] ?? [];
    if (selectedAttendanceDate === todayKey && byEmployee.length) {
      return byEmployee.map((row) => {
        const record = records.find((item) => recordEmployeeId(item) === Number(row.employeeId));
        return { key: row.employeeId, name: nameFor(row.employeeId, record?.employee), meta: row.department, status: record?.status ?? row.status, record };
      });
    }
    return records
      .filter((record) => !scopeEmployees.length || employeesById.has(recordEmployeeId(record)))
      .map((record) => {
        const id = recordEmployeeId(record);
        return { key: id, name: nameFor(id, record.employee), meta: employeesById.get(id)?.department, status: record.status, record };
      });
  };
  const teamRows = (): AttendanceRow[] => byEmployee.map((row) => {
    const record = teamRecordsForDay(teamSelectedDate).find((item) => recordEmployeeId(item) === Number(row.employeeId));
    const status = teamSelectedDate === todayKey ? (record?.status ?? row.status) : (record?.status ?? null);
    return { key: row.employeeId, name: nameFor(row.employeeId), meta: row.department, status, record };
  });
  const selectedOrgRows = isOrg ? orgRows() : [];
  const selectedTeamRows = isManager ? teamRows() : [];

  const headerStats = [
    { label: 'Attendance today', value: workingToday ? `${attendanceRate}%` : '—' },
    { label: 'Pending approvals', value: pendingTotal },
    { label: isManager ? 'Team size' : 'In scope', value: scopeCount },
  ];

  return <>
    <div className="space-y-6">
      <HeroRow
        header={<DashboardHeader
          dateText={dateText}
          name={displayName}
          roleLabel={formatRole(dashboardRole)}
          subtitle={isManager ? `Team · ${scopeCount} members in your scope` : `${scopeCount} employees in scope`}
          stats={headerStats}
        />}
        attendance={attendanceCard}
      />
      <MetricGrid metrics={metrics} />
      <AttentionRow items={[
        { label: 'Pending leave requests', count: pendingLeaves.length, description: 'Awaiting approval', onClick: () => navigate('/leave') },
        { label: 'Pending WFH requests', count: pendingWfh.length, description: 'Awaiting approval', onClick: () => navigate('/wfh') },
        { label: 'Attendance regularizations', count: Number(kpis.pendingAttendanceRegularizations ?? 0), description: 'Awaiting review', onClick: () => navigate('/employee-attendance') },
      ]} />

      <SectionHeading title="Attendance analytics" description={isManager ? 'Your authorized team only' : 'Organization-wide, live from attendance records'} />
      <div className="dashboard-grid-2">
        <Section title={isManager ? "Today's team attendance" : "Today's attendance"} eyebrow="Working-day status">
          <DonutChart data={workforceComposition} centerLabel={isManager ? 'Team' : 'Employees'} centerValue={workingToday} emptyMessage="No working-day attendance today." />
        </Section>
        <Section title={isManager ? 'Team attendance trend' : 'Attendance trend'} eyebrow={`Recorded attendance · last ${TREND_DAYS} days`}>
          <TrendLineChart data={trendHasData ? attendanceTrend : []} xKey="day" series={TREND_SERIES} emptyMessage={(isOrg ? orgTrendReady : team.loaded) ? 'No attendance recorded in the last 7 days.' : 'Loading attendance trend...'} />
        </Section>
      </div>
      <div className="dashboard-grid-2">
        <Section title={isManager ? 'Team strength by department' : 'Department strength'} eyebrow="Headcount">
          <ComparisonBarChart data={departmentStrength} xKey="department" series={[{ key: 'Employees', label: 'Employees', color: CHART_COLORS.blue }]} horizontal emptyMessage="No department data available." height={240} />
        </Section>
        <Section title="Attendance by department" eyebrow="Today">
          <ComparisonBarChart data={departmentAttendance} xKey="department" series={[{ key: 'Present', label: 'Present', color: STATUS_COLORS.present }, { key: 'Leave', label: 'Leave', color: STATUS_COLORS.leave }, { key: 'Absent', label: 'Absent', color: STATUS_COLORS.absent }]} stacked emptyMessage="No department data available." />
        </Section>
      </div>

      <SectionHeading title={isOrg ? 'Workforce, leave & payroll' : 'Leave overview'} />
      <div className={isOrg ? 'dashboard-grid-3' : 'dashboard-grid-2'}>
        {isOrg && (
          <Section title="Workforce composition" eyebrow="Employment status">
            <DonutChart data={activeComposition} centerLabel="Headcount" emptyMessage="No employees in scope." />
          </Section>
        )}
        <Section title="Pending leave by type" eyebrow="Requests awaiting approval" action={<SectionLink label="Review leave" onClick={() => navigate('/leave')} />}>
          <ComparisonBarChart data={pendingLeaveByType} xKey="type" series={[{ key: 'Requests', label: 'Requests', color: CHART_COLORS.blue }]} emptyMessage="No pending leave requests." height={260} />
        </Section>
        {isOrg ? (
          <Section title="Payroll status" eyebrow={latestPeriodLabel ? `Latest run · ${latestPeriodLabel}` : 'Latest payroll run'} action={<SectionLink label="Payroll" onClick={() => navigate('/payroll')} />}>
            <DonutChart data={payrollStatus} centerLabel="Payslips" emptyMessage="No payroll records yet." />
          </Section>
        ) : (
          <Section title="Today's team status" eyebrow="Leave and absence">
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <MiniStat label="On leave" value={kpis.onLeaveToday ?? 0} />
              <MiniStat label="Half day" value={kpis.halfDayToday ?? 0} />
              <MiniStat label="Absent" value={kpis.absentToday ?? 0} />
            </div>
          </Section>
        )}
      </div>
      {isOrg && (payrollByPeriod.length > 0 || dashboard.hr) && (
        <div className="dashboard-grid-2">
          {payrollByPeriod.length > 0 && (
            <Section title="Net payroll by month" eyebrow="Persisted payroll records">
              <ComparisonBarChart data={payrollByPeriod} xKey="period" series={[{ key: 'Net pay (₹)', label: 'Net pay (₹)', color: CHART_COLORS.blue }]} emptyMessage="No payroll records yet." height={260} />
            </Section>
          )}
          {dashboard.hr && (
            <Section title="Workforce lifecycle" eyebrow="HR pulse">
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                <MiniStat label="New joiners" value={dashboard.hr.newJoiners ?? 0} detail="Last 30 days" />
                <MiniStat label="Notice period" value={dashboard.hr.noticePeriod ?? 0} detail="Upcoming exits" />
                <MiniStat label="Probation" value={dashboard.hr.probation ?? 0} detail="Joined in last 6 months" />
              </div>
            </Section>
          )}
        </div>
      )}

      <QuickActionsSection actions={quickActions} error={actionError} />

      {isOrg && (
        <Section
          title="Employee attendance"
          eyebrow={formatAttendanceDate(selectedAttendanceDate)}
          action={<DayToggle
            selectedDate={selectedAttendanceDate}
            onSelect={setSelectedAttendanceDate}
            onPrevious={() => setSelectedAttendanceDate((current) => addBusinessDays(current, -1))}
            onNext={() => setSelectedAttendanceDate((current) => {
              const next = addBusinessDays(current, 1);
              return next <= todayKey ? next : current;
            })}
          />}
        >
          <StatusSummary statuses={selectedOrgRows.map((row) => row.status)} />
          <AttendanceRowsTable rows={selectedOrgRows} emptyMessage={organization.loadedDays.has(selectedAttendanceDate) ? 'No attendance records for the selected date.' : 'Loading attendance...'} />
        </Section>
      )}
      {isManager && (
        <Section
          title={teamSelectedDate === todayKey ? 'Team attendance today' : 'Team attendance yesterday'}
          eyebrow="Authorized team members"
          action={<DayToggle selectedDate={teamSelectedDate} onSelect={(value) => setTeamSelectedDate(value === yesterdayKey ? yesterdayKey : todayKey)} />}
        >
          <StatusSummary statuses={selectedTeamRows.map((row) => row.status)} />
          <AttendanceRowsTable rows={selectedTeamRows} emptyMessage="No team members in your scope." />
        </Section>
      )}

      <div className="dashboard-grid-2">
        <PendingList title="Pending leave requests" items={pendingLeaves} emptyMessage="No pending leave requests." onViewAll={() => navigate('/leave')} describe={(leave) => `${leave.leaveType?.name || 'Leave'} · ${leave.totalDays ?? 0} days · ${leave.reason || 'No reason provided'}`} />
        <PendingList title="Pending WFH requests" items={pendingWfh} emptyMessage="No pending WFH requests." onViewAll={() => navigate('/wfh')} describe={(request) => `${displayDate(request.startDate)} - ${displayDate(request.endDate)}`} />
      </div>
      {isOrg && (
        <Section title="Helpdesk tickets" eyebrow="Live queue" action={<SectionLink label="Open helpdesk" onClick={() => navigate('/helpdesk')} />}>
          {helpdesk.length ? <div className="divide-y divide-[#eef3f3]">{helpdesk.slice(0, 5).map((ticket: any) => <div key={ticket.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="flex min-w-0 items-center gap-3"><span className="rounded-md bg-[#edf3f5] p-2 text-[#486271]"><LifeBuoy className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-[#12354a]">{ticket.issue || 'Helpdesk ticket'}</p><p className="text-xs text-[#78909a]">{ticket.employee ? employeeName(ticket.employee) : 'Employee request'}</p></div></div><span className="shrink-0 text-xs font-semibold text-[#486271]">{statusLabel(ticket.status)}</span></div>)}</div> : <EmptyState message="No helpdesk tickets available." />}
        </Section>
      )}
    </div>
    {modals}
  </>;
}
