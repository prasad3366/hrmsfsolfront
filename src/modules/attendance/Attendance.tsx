import React, { useCallback } from 'react';
import { 
  Button, Card, CardContent, CardHeader, CardTitle, DataTable, EmptyState,
  ErrorState, LoadingState, PageHeader, Skeleton, StatCard, StatusBadge,
  type DataTableColumn,
} from '../../components/ui/components';
import { getAttendanceLocationLabel, getRecordAttendanceState, getTodayAttendanceState, useAttendance } from '../../hooks/useAttendance';
import { PunchInOutModal } from '../../components/attendance/PunchInOutModal';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { attendanceDateKey, formatAttendanceDate } from '../../utils/attendanceDate';

const Attendance = () => {
  const initialMonth = React.useMemo(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }, []);
  const [selectedMonth, setSelectedMonth] = React.useState(initialMonth);
  const {
    records,
    todayRecord,
    todayError,
    isLoading,
    error,
    refresh: attendanceRefresh,
    punchIn,
    punchOut,
    page,
    totalPages,
    setPage,
  } = useAttendance({ month: selectedMonth.month, year: selectedMonth.year });
  const [isPunchOpen, setIsPunchOpen] = React.useState(false);
  const punchButtonRef = React.useRef<HTMLButtonElement>(null);
  const isCurrentMonth = selectedMonth.month === initialMonth.month && selectedMonth.year === initialMonth.year;

  const selectMonth = (month: number, year: number) => {
    setPage(1);
    setSelectedMonth({ month, year });
  };

  const changeMonth = (offset: number) => {
    setSelectedMonth((current) => {
      const date = new Date(current.year, current.month - 1 + offset, 1);
      setPage(1);
      return { month: date.getMonth() + 1, year: date.getFullYear() };
    });
  };

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // ✅ Wrap refresh in useCallback to maintain stable reference across renders
  const refresh = useCallback(async () => {
    await attendanceRefresh();
  }, [attendanceRefresh]);

  const todayState = getTodayAttendanceState(todayRecord);
  const punchActionLabel = todayError
    ? 'Unavailable'
    : todayState === 'LEAVE'
    ? 'Leave'
    : todayState === 'IN_PROGRESS'
      ? 'Check Out'
      : todayState === 'COMPLETED'
        ? 'View'
        : 'Check In';

  const rowKey = (record: any, index: number) => (record.date ? `${record.date}-${index}` : `record-${index}`);

  // Group multiple punches per day into a single row: first punch-in and last punch-out.
  const userAttendance = React.useMemo(() => {
    const grouped: Record<string, {
      date: string;
      punchIn?: string;
      punchOut?: string;
      totalHours: number;
      status: string;
      punchInLocation?: 'OFFICE' | 'OUTSIDE' | 'WFH' | null;
      punchOutLocation?: 'OFFICE' | 'OUTSIDE' | 'WFH' | null;
      locationStatus?: 'OFFICE' | 'OUTSIDE' | 'WFH' | null;
    }> = {};

    records.forEach((rec) => {
      const dayKey = attendanceDateKey(rec.date);

      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          date: rec.date,
          punchIn: rec.punchIn || undefined,
          punchOut: rec.punchOut || undefined,
          totalHours: rec.totalHours || 0,
          status: getRecordAttendanceState(rec),
          punchInLocation: rec.punchInLocationStatus ?? null,
          punchOutLocation: rec.punchOutLocationStatus ?? null,
          locationStatus: rec.locationStatus ?? null,
        };
        return;
      }

      const existing = grouped[dayKey];

      // earliest punchIn
      if (rec.punchIn) {
        if (!existing.punchIn || new Date(rec.punchIn) < new Date(existing.punchIn)) {
          existing.punchIn = rec.punchIn;
        }
      }

      // latest punchOut
      if (rec.punchOut) {
        if (!existing.punchOut || new Date(rec.punchOut) > new Date(existing.punchOut)) {
          existing.punchOut = rec.punchOut;
        }
      }

      // accumulate total hours (best effort)
      existing.totalHours += rec.totalHours || 0;
      existing.status = getRecordAttendanceState(rec);
    });

    return Object.values(grouped)
      .sort((a, b) => attendanceDateKey(b.date).localeCompare(attendanceDateKey(a.date)));
  }, [records]);

  const historyColumns: DataTableColumn<typeof userAttendance[number]>[] = [
    { key: 'date', header: 'Date', render: (record) => <span className="font-semibold text-[#12354a]">{formatAttendanceDate(record.date)}</span> },
    { key: 'status', header: 'Status', render: (record) => <StatusBadge status={record.status === 'PRESENT' || record.status === 'COMPLETED' ? 'success' : record.status === 'IN_PROGRESS' ? 'warning' : record.status === 'LEAVE' ? 'info' : record.status === 'ABSENT' ? 'danger' : 'neutral'}>{record.status}</StatusBadge> },
    { key: 'punchIn', header: 'Check in', render: (record) => record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--' },
    { key: 'punchOut', header: 'Check out', render: (record) => record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--' },
    { key: 'totalHours', header: 'Total hours', render: (record) => record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '0.00 hrs' },
    { key: 'locationStatus', header: 'Location', render: (record) => { const label = record.punchInLocation || record.punchOutLocation ? getAttendanceLocationLabel(record.punchInLocation, record.punchOutLocation) : record.locationStatus === 'OFFICE' ? 'In Office' : record.locationStatus === 'OUTSIDE' ? 'Out of Office' : 'Unknown'; const tone = label === 'In Office' ? 'success' : label === 'Out of Office' ? 'danger' : label === 'Unknown' ? 'neutral' : 'warning'; return <StatusBadge status={tone}>{label}</StatusBadge>; } },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8" role="status">
        <div className="flex items-center gap-4 rounded-2xl border border-[#dce6e8] bg-white/80 p-6"><Skeleton className="h-12 w-12 rounded-xl" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-3 w-72 max-w-full" /></div></div>
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl lg:col-span-2" /></div>
        <LoadingState label="Loading attendance records..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Attendance" description="Track your work hours and attendance history." actions={<div className="flex items-center gap-2 rounded-xl border border-[#dce6e8] bg-white/80 p-1.5 shadow-sm"><Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => changeMonth(-1)} disabled={isLoading}><ChevronLeft size={18} /></Button><label><span className="sr-only">Select attendance month</span><input type="month" value={`${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`} onChange={(event) => { const [year, month] = event.target.value.split('-').map(Number); if (year && month) selectMonth(month, year); }} className="rounded-lg border-0 bg-transparent px-2 text-center text-sm font-bold text-[#12354a] focus:ring-2 focus:ring-[#b08a3e]" /></label><Button size="icon" variant="ghost" aria-label="Next month" onClick={() => changeMonth(1)} disabled={isLoading}><ChevronRight size={18} /></Button></div>} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-[#4c8da0]/70 bg-gradient-to-br from-[#022337] via-[#073b5c] to-[#0d526b] text-white shadow-[0_22px_52px_rgba(2,35,55,0.28),0_0_28px_rgba(30,98,125,0.16)] ring-1 ring-[#b08a3e]/20 before:opacity-0 lg:col-span-1">
          <CardHeader className="border-b border-[#8db1bd]/25 bg-[#022337]/20"><CardTitle className="text-lg font-bold text-[#fffefa]">Today's attendance</CardTitle><p className="text-sm text-[#d5e6e8]">Your current attendance status</p></CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3"><StatusBadge status={todayError ? 'danger' : todayState === 'IN_PROGRESS' ? 'warning' : todayState === 'COMPLETED' ? 'success' : todayState === 'LEAVE' ? 'info' : 'neutral'} className="border-white/30 bg-white/[0.14] text-[#fffefa] shadow-[0_4px_14px_rgba(2,35,55,0.18)]">{todayError ? 'Unavailable' : todayState}</StatusBadge><MapPin size={18} className="text-[#e3c477] drop-shadow-[0_0_8px_rgba(227,196,119,0.35)]" /></div>
            <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-[#8db1bd]/25 bg-[#0a4965]/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"><p className="text-xs font-medium text-[#b8d0d5]">Check in</p><p className="mt-1 font-bold text-[#fffefa]">{todayRecord?.punchInTime ? new Date(todayRecord.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p></div><div className="rounded-xl border border-[#8db1bd]/25 bg-[#0a4965]/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"><p className="text-xs font-medium text-[#b8d0d5]">Check out</p><p className="mt-1 font-bold text-[#fffefa]">{todayRecord?.punchOutTime ? new Date(todayRecord.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p></div><div className="rounded-xl border border-[#8db1bd]/25 bg-[#0a4965]/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"><p className="text-xs font-medium text-[#b8d0d5]">Total hours</p><p className="mt-1 font-bold text-[#fffefa]">{todayRecord?.totalHours ?? '0.00'}</p></div><div className="rounded-xl border border-[#8db1bd]/25 bg-[#0a4965]/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"><p className="text-xs font-medium text-[#b8d0d5]">Location</p><p className="mt-1 truncate font-bold text-[#fffefa]">{todayRecord?.locationStatus || 'Unknown'}</p></div></div>
            {isCurrentMonth && <Button ref={punchButtonRef} variant="gold" className="w-full" onClick={() => setIsPunchOpen(true)} disabled={Boolean(todayError) || todayState === 'LEAVE'}><Clock size={17} /> {punchActionLabel}</Button>}
            {todayError && <p className="text-xs text-[#f2b3ab]">Today's status is unavailable.</p>}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2"><StatCard label="Current status" value={todayState} /><StatCard label="Check-in" value={todayRecord?.punchInTime ? new Date(todayRecord.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} /><StatCard label="Total hours" value={todayRecord?.totalHours ?? '0.00'} detail="Backend reported value" /></div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70"><CardTitle>Your attendance history</CardTitle></CardHeader>
        <CardContent className="p-0">
          {error ? <ErrorState message={<>Unable to load attendance records: {error}</>} onRetry={() => void refresh()} /> : <DataTable columns={historyColumns} data={userAttendance} getRowKey={rowKey} emptyState={<EmptyState title="No attendance records" description="Attendance history will appear here once records are available." />} />}
          {!error && <div className="flex flex-col gap-2 border-t border-[#e4ecec] p-4 text-sm text-[#617984] sm:flex-row sm:items-center sm:justify-between"><span>Page {page} of {Math.max(totalPages, 1)}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage(Math.max(1, page - 1))}>Previous</Button><Button size="sm" variant="outline" disabled={page >= totalPages || isLoading || totalPages === 0} onClick={() => setPage(page + 1)}>Next</Button></div></div>}
        </CardContent>
      </Card>

      <PunchInOutModal
        isOpen={isCurrentMonth && isPunchOpen}
        onClose={() => setIsPunchOpen(false)}
        anchorRef={punchButtonRef}
        todayRecord={todayRecord}
        onPunchIn={punchIn}
        onPunchOut={punchOut}
        onSuccess={refresh}
      />
    </div>
  );
};

export default Attendance;