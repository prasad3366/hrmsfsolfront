import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';
import { 
  Users, Briefcase, Calendar, CheckCircle, UserPlus, Clock, ArrowUp, ArrowDown, Trash2, DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { MOCK_EMPLOYEES } from '../../mock-data';
import ApiService from '../../services/api';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import CreateHolidayModal from '../../components/holidays/CreateHolidayModal';
import { useWfh } from '../../hooks/useWfh';
import { useHolidays } from '../../hooks/useHolidays';
import { useNotifications } from '../../context/NotificationContext';
import { WfhApprovalList } from '../../components/wfh/WfhApprovalList';
import { useAttendance } from '../../hooks/useAttendance';
import { useLeave } from '../../hooks/useLeave';

const StatCard = ({ title, value, icon: Icon, trend, subtext, color = "blue", delay = 0 }: any) => {
  const colors: Record<string, string> = {
    blue: "border-blue-200",
    green: "border-emerald-200",
    purple: "border-violet-200",
    orange: "border-amber-200",
    rose: "border-rose-200",
  };

  const iconColors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    purple: "bg-violet-100 text-violet-600",
    orange: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <Card className={`border ${colors[color]} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4`} style={{ animationDelay: `${delay}ms` }} hoverEffect>
      <CardContent className="p-6 flex items-start justify-between">
        <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
            
            <div className="mt-3 flex items-center text-xs font-semibold">
                {trend === 'up' && (
                    <span className="text-emerald-600 flex items-center gap-1">
                        <ArrowUp size={12} strokeWidth={3} /> {subtext}
                    </span>
                )}
                {trend === 'down' && (
                    <span className="text-rose-600 flex items-center gap-1">
                        <ArrowDown size={12} strokeWidth={3} /> {subtext}
                    </span>
                )}
                {!trend && <span className="text-slate-400">{subtext}</span>}
            </div>
        </div>
        
        <div className={`${iconColors[color]} p-3 rounded-lg`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </CardContent>
    </Card>
  );
};

const HRDashboard = () => {
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const navigate = useNavigate();
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [newHiresCount, setNewHiresCount] = useState<number>(0);
  const [isCreateHolidayOpen, setIsCreateHolidayOpen] = useState(false);

  const isEmployeeActive = (emp: any) => {
    const status = (emp.status || emp.user?.status || '').toString().toUpperCase();
    if (status === 'ACTIVE') return true;
    if (status === 'INACTIVE' || status === 'TERMINATED') return false;
    if (typeof emp.user?.isActive === 'boolean') return emp.user.isActive;
    if (typeof emp.isActive === 'boolean') return emp.isActive;
    return true;
  };
  const [attendanceTab, setAttendanceTab] = useState<'inside' | 'outside' | 'wfh'>('inside');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(today.setDate(diff));
  });
  const { wfhRequests, isLoading: isWfhLoading, fetchAllWfhRequests } = useWfh();
  const { holidays, isSubmitting: isHolidaySubmitting, fetchHolidaysByYear, createHoliday, deleteHoliday } = useHolidays();
  const { pendingLeaves, fetchPendingLeaves, approveLeave } = useLeave();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { records: attendanceRecords, isLoading: isAttendanceLoading } = useAttendance({ scope: 'all' });

  // Track employees for name resolution
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});

  const getEmployeeDisplayName = (record: any) => {
    if (!record) return 'Unknown';
    if (record.employeeName) return record.employeeName;
    if (record.employee?.firstName || record.employee?.lastName) {
      const first = record.employee?.firstName || '';
      const last = record.employee?.lastName || '';
      return `${first} ${last}`.trim();
    }
    if (record.employee?.name) return record.employee.name;
    if (record.employeeId) {
      const idKey = String(record.employeeId);
      if (employeeMap[idKey]) return employeeMap[idKey];
    }
    if (record.employee?.empCode && employeeMap[record.employee.empCode]) {
      return employeeMap[record.employee.empCode];
    }
    return 'Unknown';
  };

  const getLeaveReason = (leave: any) => {
    if (!leave) return 'No reason provided';
    return (
      leave.reason ||
      leave.remarks ||
      leave.comment ||
      leave.description ||
      leave.notes ||
      'No reason provided'
    );
  };

  // Calculate dynamic work duration data
  const workDurationData = useMemo(() => {
    const days = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      
      // Get all attendance records for this specific day
      const dayRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === date.toDateString();
      });
      
      // Calculate total work hours for the day
      let totalDuration = 0;
      
      if (dayRecords.length > 0) {
        dayRecords.forEach(record => {
          // Only count PRESENT records
          if (record.status === 'PRESENT' && record.punchIn && record.punchOut) {
            const checkIn = new Date(record.punchIn);
            const checkOut = new Date(record.punchOut);
            const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            totalDuration += hoursWorked;
          } else if (record.status === 'PRESENT') {
            // If no timeIn/timeOut but marked present, assume full day
            totalDuration += 8;
          }
        });
      }
      
      const dateStr = `${date.getDate()}-${monthNames[date.getMonth()]}`;
      days.push({ 
        date: dateStr, 
        duration: parseFloat(totalDuration.toFixed(1)),
        count: dayRecords.length 
      });
    }
    
    return days;
  }, [currentWeekStart, attendanceRecords]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleRestoreCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  useEffect(() => {
    fetchAllWfhRequests();
    fetchPendingLeaves();
  }, [fetchAllWfhRequests, fetchPendingLeaves]);

  // Fetch holidays on mount
  useEffect(() => {
    fetchHolidaysByYear(new Date().getFullYear());
  }, [fetchHolidaysByYear]);

  // Fetch dynamic employee counts
  useEffect(() => {
    let mounted = true;
    ApiService.getAllEmployees()
      .then((data) => {
        if (!mounted) return;
        const list = data || [];
        const activeEmployees = list.filter(isEmployeeActive);
        setTotalEmployees(activeEmployees.length);

        // Build employee name map for attendance display
        const map: Record<string, string> = {};
        list.forEach((emp: any) => {
          const id = emp.id ?? emp.employeeId ?? emp.user?.id;
          const name = `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Unknown';
          if (id !== undefined && id !== null) {
            map[String(id)] = name;
          }
          if (emp.empCode) {
            map[String(emp.empCode)] = name;
          }
        });
        setEmployeeMap(map);

        // compute new hires in last 30 days if createdAt available
        const now = Date.now();
        const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
        const newCount = activeEmployees.filter((emp: any) => {
          if (!emp.createdAt) return false;
          const created = new Date(emp.createdAt).getTime();
          return now - created <= THIRTY_DAYS;
        }).length;
        setNewHiresCount(newCount);
      })
      .catch((err) => {
        console.error('Failed to fetch employees for dashboard', err);
        setTotalEmployees(null);
        setNewHiresCount(0);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Show notification when there are pending WFH requests
  useEffect(() => {
    const pendingCount = wfhRequests.filter((req) => req.status === 'PENDING').length;
    if (pendingCount > 0) {
      addNotification({
        type: 'wfh_request',
        title: `${pendingCount} Pending WFH Request${pendingCount > 1 ? 's' : ''}`,
        message: `You have ${pendingCount} work from home request${pendingCount > 1 ? 's' : ''} awaiting approval.`,
      });
    }
  }, [wfhRequests, addNotification]);

  const handleEmployeeCreated = (employee: any) => {
    setIsCreateEmployeeOpen(false);
  };

  const handleApproveAllLeaves = async () => {
    if (pendingLeaves.length === 0) return;
    await Promise.all(pendingLeaves.map((leave) => approveLeave(leave.id)));
  };

  const handleHolidayCreated = async (data: any) => {
    try {
      await createHoliday(data);
      setIsCreateHolidayOpen(false);
      // Refresh holidays list
      fetchHolidaysByYear(new Date().getFullYear());
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Get pending WFH requests
  const pendingWfhRequests = wfhRequests.filter((req) => req.status === 'PENDING');

  // Define the missing variables
  const insideOffice = attendanceRecords.filter(record => record.locationStatus === 'OFFICE');
  const outsideOffice = attendanceRecords.filter(record => record.locationStatus === 'OUTSIDE');
  const wfhEmployees = attendanceRecords.filter(record => record.locationStatus === 'WFH');

  const recentAttendance = useMemo(() => {
    return attendanceRecords
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [attendanceRecords]);

  return (
  <div className="space-y-8">
    {/** Stat cards - clicking Total Employees navigates to the employee list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div onClick={() => navigate('/employees')} role="button" tabIndex={0} className="cursor-pointer">
        <StatCard
          title="Total Employees"
          value={totalEmployees !== null ? String(totalEmployees.toLocaleString()) : '—'}
          icon={Users}
          trend="up"
          subtext={`${newHiresCount} new`}
          color="blue"
          delay={0}
        />
      </div>
      <StatCard title="Open Positions" value="18" icon={Briefcase} trend="up" subtext="3 urgent" color="purple" delay={100} />
      <StatCard title="Pending Leaves" value={pendingLeaves.length} icon={Clock} trend="down" subtext="awaiting review" color="orange" delay={200} />
      <StatCard title="Attendance Today" value="92%" icon={CheckCircle} trend="up" subtext="8% up" color="green" delay={300} />
    </div>

    <div>
      {/* Total Work Duration Chart */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow mb-6" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
                <CardTitle className="text-base">Total Work Duration</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Hours worked per day</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRestoreCurrentWeek}>Restore</Button>
        </CardHeader>
        <CardContent className="pt-6 relative">
          <div className="flex items-center gap-4">
            <button onClick={handlePreviousWeek} className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            
            <div className="h-[320px] w-full min-h-[320px] flex-1" style={{ minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height={320} debounce={100}>
                <LineChart data={workDurationData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 12}} 
                  />
                  <YAxis 
                    type="number"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 12}}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff' }}
                    labelStyle={{ color: '#000' }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === 'duration') {
                        return [`${value}h total`, 'Work Duration'];
                      }
                      return [value, name];
                    }}
                    content={(props: any) => {
                      const { active, payload, label } = props;
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg text-sm border border-slate-200 shadow-lg" style={{ minWidth: '200px' }}>
                          <p className="text-slate-900 font-semibold">{data.date}</p>
                          <p className="text-slate-700 mt-1">Total Hours: <span className="text-blue-600">{data.duration}h</span></p>
                          <p className="text-slate-700">Employees: <span className="text-blue-600">{data.count || 0}</span></p>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="square"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    name="Total Work Duration"
                    stroke="#60A5FA" 
                    strokeWidth={3} 
                    dot={{ fill: '#93C5FD', r: 5, strokeWidth: 2, stroke: '#60A5FA' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button onClick={handleNextWeek} className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </CardContent>
      </Card>

    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <CardTitle className="text-base">Pending Leave Requests</CardTitle>
            <Button variant="ghost" size="xs" onClick={handleApproveAllLeaves}>Approve All</Button>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
              {pendingLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-6">
                    No pending leave requests.
                  </TableCell>
                </TableRow>
              ) : (
                pendingLeaves.map((leave) => (
                  <TableRow key={leave.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-900">
                          {getEmployeeDisplayName(leave)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">
                        {leave.leaveType?.name || 'Leave'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-slate-600">
                      {leave.totalDays ?? '--'} days
                    </TableCell>
                    <TableCell className="py-4 text-sm text-slate-600">
                      {getLeaveReason(leave)}
                    </TableCell>
                    <TableCell className="py-4">
                      <button
                        onClick={() => approveLeave(leave.id)}
                        className="text-xs text-emerald-600 font-bold hover:text-emerald-700 hover:underline"
                      >
                        Approve
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
            </Table>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="pb-4 border-b"><CardTitle className="text-base">HR Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-4">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsCreateEmployeeOpen(true); }}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200">
                <UserPlus size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Add Employee</span>
            </button>
            <button 
              type="button"
              onClick={() => navigate('/payroll')}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-200">
                <DollarSign size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Run Payroll</span>
            </button>
            <button 
              onClick={() => setIsCreateHolidayOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-200">
                <Clock size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Create Holidays</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200">
                <Calendar size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">View Reports</span>
            </button>
        </CardContent>
      </Card>
    </div>

    <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
      <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">WFH Requests</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Pending work from home requests - {pendingWfhRequests.length} pending</p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <WfhApprovalList
          requests={wfhRequests}
          isLoading={isWfhLoading}
          onRefresh={fetchAllWfhRequests}
        />
      </CardContent>
    </Card>

    {/* Holidays List */}
    <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-base">Holidays</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Manage company holidays</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateHolidayOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">Add Holiday</Button>
      </CardHeader>
      <CardContent className="pt-6">
        {holidays && holidays.length > 0 ? (
          <div className="space-y-4">
            {holidays.map((holiday: any) => (
              <div key={holiday.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">{holiday.name}</h4>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar size={14} className="text-slate-600" />
                      <span className="text-slate-600 font-medium">{new Date(holiday.date).toLocaleDateString('en-GB')}</span>
                    </div>
                    {holiday.location && (
                      <a href="#" className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <span>📍 {holiday.location}</span>
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteHoliday(holiday.id)}
                  disabled={isHolidaySubmitting}
                  className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Delete holiday"
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No holidays created yet</p>
        )}
      </CardContent>
    </Card>

    {/* Employee Creation Modal */}
    <CreateEmployeeModal
      isOpen={isCreateEmployeeOpen}
      onClose={() => setIsCreateEmployeeOpen(false)}
      onSuccess={handleEmployeeCreated}
    />

    {/* Holiday Creation Modal */}
    <CreateHolidayModal
      isOpen={isCreateHolidayOpen}
      onClose={() => setIsCreateHolidayOpen(false)}
      onSubmit={handleHolidayCreated}
      isSubmitting={isHolidaySubmitting}
    />

    <div className="lg:col-span-full">
      <Card className="border shadow-sm hover:shadow-md transition-shadow h-full" hoverEffect>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-6 rounded-t-lg">
          <h2 className="text-xl font-bold mb-4">Today's Attendance</h2>
          <div className="flex gap-6">
            <button
              onClick={() => setAttendanceTab('inside')}
              className={`pb-3 border-b-2 transition-all ${
                attendanceTab === 'inside'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-blue-100 hover:text-white'
              }`}
            >
              <Clock size={18} className="inline mr-2" />
              Inside Office
            </button>
            <button
              onClick={() => setAttendanceTab('outside')}
              className={`pb-3 border-b-2 transition-all ${
                attendanceTab === 'outside'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-blue-100 hover:text-white'
              }`}
            >
              📍 Outside
            </button>
            <button
              onClick={() => setAttendanceTab('wfh')}
              className={`pb-3 border-b-2 transition-all ${
                attendanceTab === 'wfh'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-blue-100 hover:text-white'
              }`}
            >
              💻 Work from Home
            </button>
          </div>
        </div>
        <CardContent className="pt-6">
          {attendanceTab === 'inside' && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Employees in Office</h3>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {insideOffice.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-slate-500 py-6">
                          {isAttendanceLoading ? 'Loading…' : 'No employees currently punched in at the office.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      insideOffice.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{getEmployeeDisplayName(record)}</TableCell>
                          <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                          <TableCell>{record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
          {attendanceTab === 'outside' && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Employees Outside Office</h3>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {outsideOffice.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-slate-500 py-6">
                          {isAttendanceLoading ? 'Loading…' : 'No employees currently punched in outside the office.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      outsideOffice.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{getEmployeeDisplayName(record)}</TableCell>
                          <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                          <TableCell>{record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
          {attendanceTab === 'wfh' && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Employees Working from Home</h3>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {wfhEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-slate-500 py-6">
                          {isAttendanceLoading ? 'Loading…' : 'No employees currently working from home.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      wfhEmployees.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{getEmployeeDisplayName(record)}</TableCell>
                          <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                          <TableCell>{record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Attendance History Card */}
    <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-base">Attendance History</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Most recent punches for all employees</p>
        </div>
        <Button size="xs" variant="outline">View All</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {recentAttendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500 py-8">
                  {isAttendanceLoading ? 'Loading attendance…' : 'No attendance records found.'}
                </TableCell>
              </TableRow>
            ) : (
              recentAttendance.map((record) => (
                <TableRow key={`${record.id}-${record.date}`} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="py-3 text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="py-3 text-sm">
                    {getEmployeeDisplayName(record)}
                  </TableCell>
                  <TableCell className="py-3 text-sm">
                    {record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </TableCell>
                  <TableCell className="py-3 text-sm">
                    {record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </TableCell>
                  <TableCell className="py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      {record.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  </div>
  );
};

export default HRDashboard;
