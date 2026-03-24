import React from 'react';
import { 
  Table, TableHeader, TableRow, TableHead, TableCell, 
  Badge, Card, CardHeader, CardTitle, CardContent, Button
} from '../../components/ui/components';
import { useAttendance } from '../../hooks/useAttendance';
import { PunchInOutModal } from '../../components/attendance/PunchInOutModal';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

const Attendance = () => {
  const { records, todayRecord, isLoading, refresh } = useAttendance();
  const [isPunchOpen, setIsPunchOpen] = React.useState(false);

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
      const d = new Date(rec.date);
      const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          date: rec.date,
          punchIn: rec.punchIn || undefined,
          punchOut: rec.punchOut || undefined,
          totalHours: rec.totalHours || 0,
          status: rec.status,
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
    });

    return Object.values(grouped)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500">Track your work hours and logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader>
             <CardTitle className="text-base">Today's Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Today's Action</h3>
              <p className="text-slate-500 mb-6">Tap to record your attendance</p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setIsPunchOpen(true)}
                    className="h-32 w-32 rounded-full bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex flex-col items-center justify-center"
                  >
                    <Clock size={32} className="mb-2" />
                    {!todayRecord?.hasPunchedIn && !todayRecord?.punchInTime ? 'Check In' : !todayRecord?.hasPunchedOut && !todayRecord?.punchOutTime ? 'Check Out' : 'View'}
                  </Button>
                </div>
                <div className="mt-6 flex flex-col items-center text-sm text-slate-500 gap-2">
                    <MapPin size={16} />
                    <span>Remote - IP 192.168.1.1</span>
                    {(todayRecord?.hasPunchedIn || todayRecord?.punchInTime) && (
                      <span>Check-In Time: {new Date(todayRecord.punchInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                        userAttendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                            <TableCell>{record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                            <TableCell>{record.totalHours ? `${record.totalHours} hrs` : '0.00 hrs'}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'ABSENT' ? 'danger' : 'default'}>
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <PunchInOutModal
        isOpen={isPunchOpen}
        onClose={() => setIsPunchOpen(false)}
        todayRecord={todayRecord}
        onSuccess={refresh}
      />
    </div>
  );
};

export default Attendance;