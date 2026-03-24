import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui/components';
import {
  Calendar, Clock, FileText, ChevronRight, CheckCircle2, BarChart3,
  Home, Award, Activity, Target, AlertCircle, IndianRupee // ← added if you have it, else use FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { PunchInOutModal } from '../../components/attendance/PunchInOutModal';
import { useAttendance } from '../../hooks/useAttendance';
import { RequestWfhModal } from '../../components/wfh/RequestWfhModal';
import { useWfh } from '../../hooks/useWfh';
import { useHolidays } from '../../hooks/useHolidays';
import { useLeave } from '../../hooks/useLeave';
import { useAuth } from '../../context/AuthContext';
import { usePayroll } from '../../hooks/usePayroll';

// ────────────────────────────────────────────────
// Metric Card (slightly improved version)
const MetricCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  trendUp = true,
  accent = false, // for pending items highlight
}: {
  title: string;
  value: string | number;
  icon: any;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  accent?: boolean;
}) => {
  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p
              className={`text-2xl sm:text-3xl font-bold mt-1 ${
                accent && typeof value === 'number' && value > 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}
            >
              {value}
            </p>
            {subtext && <p className="text-sm text-gray-600 mt-1">{subtext}</p>}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={trendUp ? 'text-emerald-600' : 'text-red-600'}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
            <span className="text-gray-500 ml-1.5">vs previous</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ────────────────────────────────────────────────
// StatusBadge & QuickActionButton remain the same
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  };

  const config = styles[status.toUpperCase() as keyof typeof styles] || styles.PENDING;

  return (
    <Badge
      variant="default"
      className={`${config.bg} ${config.text} border-none gap-1.5 px-3 py-1 font-medium`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
};

const QuickActionButton = ({ icon: Icon, label, onClick }: any) => (
  <Button
    variant="outline"
    className="justify-start h-auto py-4 px-5 text-left border-gray-200 hover:border-gray-300 hover:bg-gray-50 group"
    onClick={onClick}
  >
    <div className="mr-3 p-2 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
      <Icon className="h-5 w-5 text-gray-600" />
    </div>
    <div className="flex-1">
      <div className="font-medium text-gray-900">{label}</div>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
  </Button>
);

// ────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isRequestWfhOpen, setIsRequestWfhOpen] = useState(false);

  const { user } = useAuth();
  const { todayRecord, records, refresh } = useAttendance();
  const { myWfhRequests, isLoading: isWfhLoading, fetchMyWfhRequests } = useWfh();
  const { myHolidays, fetchMyHolidays } = useHolidays();
  const { myLeaveBalance, fetchMyLeaveBalance, isLoading: isLeaveLoading } = useLeave();
  const { payrolls, fetchPayroll, loading: isPayrollLoading } = usePayroll();

  useEffect(() => {
    fetchMyWfhRequests();
    fetchMyHolidays();
    fetchMyLeaveBalance(new Date().getFullYear());
    if (user?.employeeId) {
      fetchPayroll(user.employeeId);
    }
  }, [user?.employeeId]);

  // Calculate leave balance
  const totalLeaveBalance = useMemo(() => {
    return myLeaveBalance.reduce((total, leaveType) => total + (leaveType.balance || 0), 0);
  }, [myLeaveBalance]);

  // Get latest payslip
  const latestPayslip = useMemo(() => {
    if (payrolls.length === 0) return null;
    return payrolls.sort((a, b) => new Date(b.payPeriodEnd).getTime() - new Date(a.payPeriodEnd).getTime())[0];
  }, [payrolls]);

  // Calculate pending requests
  const pendingRequests = useMemo(() => {
    const pendingWfh = myWfhRequests.filter(req => req.status === 'PENDING').length;
    // Note: Leave requests would need to be fetched separately if needed
    return pendingWfh; // For now, just WFH requests
  }, [myWfhRequests]);

  // Chart data - last 7 days (still using attendance for chart → can be removed later if needed)
  const chartData = records
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map((record) => ({
      day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: parseFloat(record.totalHours?.toString() || '0'),
    }));

  const currentHours = todayRecord?.totalHours || 0;
  const punchInTime = todayRecord?.punchInTime
    ? new Date(todayRecord.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const punchOutTime = todayRecord?.punchOutTime
    ? new Date(todayRecord.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const isPunchedIn = todayRecord?.hasPunchedIn && !todayRecord?.hasPunchedOut;

  return (
    <div className="min-h-screen bg-gray-50/40 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">

        {/* ─── New Metrics ──── No attendance related ───── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Leave Balance"
            value={isLeaveLoading ? '...' : `${totalLeaveBalance} days`}
            subtext="Annual + Casual remaining"
            icon={Calendar}
          />

          <MetricCard
            title="Goals Progress"
            value="72%"
            subtext="Q1 objectives on track"
            icon={Target}
            trend="+8%"
            trendUp={true}
          />

          <MetricCard
            title="Latest Payslip"
            value={isPayrollLoading ? '...' : latestPayslip ? `₹${latestPayslip.netPay?.toLocaleString() || '0'}` : 'No data'}
            subtext={latestPayslip ? `Net pay - ${new Date(latestPayslip.payPeriodEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'No payslip available'}
            icon={FileText}
          />

          <MetricCard
            title="Pending Requests"
            value={pendingRequests}
            subtext="Leave + WFH awaiting approval"
            icon={AlertCircle}
            accent={true} // makes number red if > 0
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Weekly Chart (still attendance based — consider changing title/data later) */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle>Weekly Working Hours</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.length > 0 ? chartData : [{ day: 'No data', hours: 0 }]}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={13} />
                    <YAxis stroke="#64748b" fontSize={13} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorHours)"
                      dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tasks placeholder */}
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle>My Tasks</CardTitle>
                <Button variant="ghost" size="sm">
                  View all →
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { task: 'Complete monthly report', status: 'in-progress' },
                  { task: 'Review project proposal', status: 'completed' },
                  { task: 'Client presentation prep', status: 'pending' },
                  { task: 'Code review for team PR', status: 'in-progress' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="font-medium text-gray-800">{item.task}</div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Today's Attendance & Quick Actions */}
          <div className="space-y-8">
            {/* Today's Attendance Card */}
            <Card className="border-gray-200 overflow-hidden">
              <CardHeader className="bg-gray-50/70 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Today's Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium">
                      {!todayRecord?.hasPunchedIn
                        ? 'Not Started'
                        : todayRecord?.hasPunchedOut
                        ? 'Completed'
                        : 'Active'}
                    </span>
                  </div>

                  {todayRecord?.hasPunchedIn && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Punch In</span>
                        <span className="font-medium">{punchInTime}</span>
                      </div>
                      {punchOutTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Punch Out</span>
                          <span className="font-medium">{punchOutTime}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t flex justify-between text-base font-medium">
                        <span>Total Hours</span>
                        <span>{currentHours.toFixed(1)} h</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => setIsPunchModalOpen(true)}
                  className="w-full"
                  variant={isPunchedIn ? 'default' : todayRecord?.hasPunchedOut ? 'secondary' : 'default'}
                >
                  {!todayRecord?.hasPunchedIn
                    ? 'Punch In'
                    : !todayRecord?.hasPunchedOut
                    ? 'Punch Out'
                    : 'View Details'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200">
              <CardHeader className="bg-gray-50/70 border-b">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                <QuickActionButton icon={FileText} label="View Payslip" />
                <QuickActionButton icon={Calendar} label="Request Leave" />
                <QuickActionButton
                  icon={Home}
                  label="Request Work From Home"
                  onClick={() => setIsRequestWfhOpen(true)}
                />
                <QuickActionButton icon={Award} label="View Performance" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom section - WFH & Holidays */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* WFH Requests */}
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50/70 border-b">
              <CardTitle>Work From Home Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isWfhLoading ? (
                <div className="py-12 text-center text-gray-500">Loading...</div>
              ) : myWfhRequests.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No WFH requests yet</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {myWfhRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-medium">
                            {new Date(req.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' → '}
                            {new Date(req.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          {req.reason && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.reason}</p>
                          )}
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Holidays */}
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50/70 border-b">
              <CardTitle>Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {myHolidays?.filter((h) => new Date(h.date) >= new Date()).length === 0 ? (
                <div className="py-12 text-center text-gray-500">No upcoming holidays</div>
              ) : (
                <div className="space-y-4">
                  {myHolidays
                    .filter((h) => new Date(h.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 4)
                    .map((holiday) => (
                      <div
                        key={holiday.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium">{holiday.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(holiday.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <Badge variant="default" className="whitespace-nowrap">
                            {holiday.isOptional ? 'Optional' : 'Mandatory'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PunchInOutModal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        todayRecord={todayRecord}
        onSuccess={refresh}
      />

      <RequestWfhModal
        isOpen={isRequestWfhOpen}
        onClose={() => setIsRequestWfhOpen(false)}
        onSuccess={fetchMyWfhRequests}
      />
    </div>
  );
}