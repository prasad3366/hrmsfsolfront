import React, { useCallback } from 'react';
import { 
  Table, TableHeader, TableRow, TableHead, TableCell, 
  Badge, Card, CardHeader, CardTitle, CardContent, Button
} from '../../components/ui/components';
import { getRecordAttendanceState, getTodayAttendanceState, useAttendance } from '../../hooks/useAttendance';
import { PunchInOutModal } from '../../components/attendance/PunchInOutModal';
import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const hasPunchedIn = todayState === 'IN_PROGRESS' || todayState === 'COMPLETED';

  const punchActionLabel = todayError
    ? 'Unavailable'
    : todayState === 'LEAVE'
    ? 'Leave'
    : todayState === 'IN_PROGRESS'
      ? 'Check Out'
      : todayState === 'COMPLETED'
        ? 'View'
        : 'Check In';

  const statusBadgeVariant = (status: string) => {
    const normalized = status?.toString().toUpperCase();
    if (normalized === 'PRESENT') return 'success';
    if (normalized === 'ABSENT') return 'danger';
    if (normalized === 'LEAVE') return 'default';
    if (normalized === 'IN_PROGRESS') return 'warning';
    return 'default';
  };

  const rowKey = (record: any, index: number) => (record.date ? `${record.date}-${index}` : `record-${index}`);

  // Group multiple punches per day into a single row: first punch-in and last punch-out.
  const userAttendance = React.useMemo(() => {
    const grouped: Record<string, {
      date: string;
      punchIn?: string;
      punchOut?: string;
      totalHours: number;
      status: string;
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

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto text-center text-slate-500">
        Loading attendance records...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500">Track your work hours and logs</p>
        <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
          <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => changeMonth(-1)} disabled={isLoading}>
            <ChevronLeft size={18} />
          </Button>
          <label>
            <span className="sr-only">Select attendance month</span>
            <input
              type="month"
              value={`${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`}
              onChange={(event) => {
                const [year, month] = event.target.value.split('-').map(Number);
                if (year && month) selectMonth(month, year);
              }}
              className="rounded border-0 text-center font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => changeMonth(1)} disabled={isLoading}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        <Card className="col-span-1">
          <CardHeader>
             <CardTitle className="text-base">Today's Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Today's Action</h3>
              <p className="text-slate-500 mb-6">Tap to record your attendance</p>
                {isCurrentMonth && <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setIsPunchOpen(true)}
                    disabled={Boolean(todayError) || todayState === 'LEAVE'}
                    className="h-32 w-32 rounded-full bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex flex-col items-center justify-center"
                  >
                    <Clock size={32} className="mb-2" />
                    {punchActionLabel}
                  </Button>
                </div>}
                <div className="mt-6 flex flex-col items-center text-sm text-slate-500 gap-2">
                    <MapPin size={16} />
                    <span>Remote - IP 192.168.1.1</span>
                    {todayError && <span className="text-rose-600">Today&apos;s status is unavailable.</span>}
                    {isCurrentMonth && hasPunchedIn && todayRecord?.punchInTime && (
                      <span>Check-In Time: {new Date(todayRecord.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Your Attendance</CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                  <p className="py-8 text-center text-sm text-rose-600">
                    Unable to load attendance records: {error}
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody>
                        {userAttendance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-slate-500 py-8">
                              No attendance records found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          userAttendance.map((record, index) => (
                            <TableRow key={rowKey(record, index)}>
                              <TableCell className="font-medium">{formatAttendanceDate(record.date)}</TableCell>
                              <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                              <TableCell>{record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                              <TableCell>{record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '0.00 hrs'}</TableCell>
                              <TableCell>
                                <Badge variant={statusBadgeVariant(record.status)}>
                                  {record.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </tbody>
                    </Table>
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1 || isLoading}
                        onClick={() => setPage(Math.max(1, page - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-600">
                        Page {page} of {Math.max(totalPages, 1)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages || isLoading || totalPages === 0}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
            </CardContent>
        </Card>
      </div>

      <PunchInOutModal
        isOpen={isCurrentMonth && isPunchOpen}
        onClose={() => setIsPunchOpen(false)}
        todayRecord={todayRecord}
        onPunchIn={punchIn}
        onPunchOut={punchOut}
        onSuccess={refresh}
      />
    </div>
  );
};

export default Attendance;