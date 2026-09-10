import React, { useEffect, useState } from 'react';
import { BarChart3, CalendarCheck, Download, FileSpreadsheet, GraduationCap, RefreshCw, Users } from 'lucide-react';
import api, { ReportsSummary } from '../services/api';
import { downloadCSV } from '../utils/csvExport';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui/components';

const metricDefinitions = [
  { key: 'totalEmployees', fallback: 'employees', label: 'Total Employees', icon: Users, color: 'blue' },
  { key: 'attendanceRate', fallback: 'attendance', label: 'Attendance Rate', icon: CalendarCheck, color: 'emerald' },
  { key: 'trainingCompletionRate', fallback: 'trainingCompletion', label: 'Training Completion', icon: GraduationCap, color: 'violet' },
  { key: 'activeDepartments', fallback: 'departments', label: 'Active Departments', icon: BarChart3, color: 'orange' },
] as const;

export const getSummaryValue = (summary: ReportsSummary, key: string, fallback: string) => {
  if (key === 'attendanceRate') return `${summary?.todayAttendancePercentage ?? 0}%`;
  if (key === 'trainingCompletionRate') return `${summary?.trainingCompletionRate ?? 0}%`;
  if (key === 'activeDepartments') return summary?.activeDepartments ?? 0;
  return summary[key] ?? summary[fallback] ?? 0;
};
const getError = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
const metricColors = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  orange: 'bg-orange-50 text-orange-600',
} as const;

const ReportsPage = () => {
  const [summary, setSummary] = useState<ReportsSummary>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getReportsSummary();
      setSummary(data && typeof data === 'object' ? data : {});
    } catch (err) {
      setError(getError(err, 'Unable to load report summary'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchSummary(); }, []);

  const exportReport = async (type: 'employees' | 'attendance' | 'training') => {
    setBusy(type); setError(''); setSuccess('');
    try {
      const result = type === 'employees'
        ? await api.exportEmployeeReport()
        : type === 'attendance'
          ? await api.exportAttendanceReport()
          : await api.exportTrainingReport();
      if (!result.length) {
        setError(`No ${type} report data is available to export.`);
        return;
      }
      downloadCSV(result, `${type}-report`);
      setSuccess(`${type[0].toUpperCase()}${type.slice(1)} report downloaded.`);
    } catch (err) {
      setError(getError(err, `Unable to export ${type} report`));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-blue-600"><BarChart3 size={18} /><span className="text-xs font-bold uppercase tracking-widest">Insights &amp; exports</span></div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports &amp; Analytics</h1><p className="mt-1 text-sm text-slate-500">Understand workforce activity with current HR data.</p></div>
        <Button variant="outline" onClick={() => void fetchSummary()} disabled={loading}><RefreshCw size={15} className="mr-2" />Refresh data</Button>
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
        {metricDefinitions.map(({ key, fallback, label, icon: Icon, color }) => <Card key={key}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : String(getSummaryValue(summary || {}, key, fallback))}</p></div><div className={`rounded-xl p-3 ${metricColors[color]}`}><Icon size={21} /></div></CardContent></Card>)}
      </section>
      <Card>
        <CardHeader className="border-b border-slate-100"><div className="flex items-center justify-between"><div><CardTitle className="text-lg">Export center</CardTitle><p className="mt-1 text-sm text-slate-500">Download current portal data as CSV files for analysis.</p></div><Badge variant="blue"><FileSpreadsheet size={13} className="mr-1" />CSV</Badge></div></CardHeader>
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          {([['employees', 'Employee directory', 'Headcount, departments, and employee details'], ['attendance', 'Attendance report', 'Attendance records and working-day activity'], ['training', 'Training report', 'Programs, enrollment, and completion data']] as const).map(([type, title, description]) => <div key={type} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4"><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div><Button className="mt-5 w-full" variant="outline" onClick={() => void exportReport(type)} disabled={busy !== ''}><Download size={15} className="mr-2" />{busy === type ? 'Preparing...' : 'Download CSV'}</Button></div>)}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
