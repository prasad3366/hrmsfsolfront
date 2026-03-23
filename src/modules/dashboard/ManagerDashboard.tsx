import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';
import { 
  Users, Layers, CheckCircle, Calendar, TrendingUp, ArrowUp, ArrowDown, Target, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { MOCK_EMPLOYEES } from '../../mock-data';
import { useWfh } from '../../hooks/useWfh';
import { useAttendance } from '../../hooks/useAttendance';
import ApiService from '../../services/api';

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

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { wfhRequests, isLoading: isWfhLoading, fetchAllWfhRequests } = useWfh();
  const { records: attendanceRecords, isLoading: isAttendanceLoading } = useAttendance({ scope: 'all' });
  const [employees, setEmployees] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<number>(12);
  const [activeTasks, setActiveTasks] = useState<number>(34);
  const [completedTasks, setCompletedTasks] = useState<number>(128);

  useEffect(() => {
    fetchAllWfhRequests();
    
    // Fetch team data from API
    ApiService.getAllEmployees()
      .then((data) => {
        const employeeList = data || [];
        setEmployees(employeeList);
        setTeamMembers(employeeList.length);
        
        // Calculate active tasks (placeholder - would come from task management API)
        setActiveTasks(Math.floor(employeeList.length * 2.8));
        
        // Calculate completed tasks (placeholder)
        setCompletedTasks(employeeList.length * 10);
      })
      .catch((err) => {
        console.error('Failed to fetch team data', err);
        // Fallback to mock data if API fails
        setEmployees(MOCK_EMPLOYEES);
        setTeamMembers(MOCK_EMPLOYEES.length);
        setActiveTasks(Math.floor(MOCK_EMPLOYEES.length * 2.8));
        setCompletedTasks(MOCK_EMPLOYEES.length * 10);
      });
  }, [fetchAllWfhRequests]);

  // Calculate team attendance percentage
  const teamAttendance = useMemo(() => {
    if (attendanceRecords.length === 0) return 88; // fallback
    
    const today = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(record => 
      new Date(record.date).toDateString() === today
    );
    
    if (todayRecords.length === 0) return 88; // fallback
    
    const presentCount = todayRecords.filter(record => 
      record.status === 'PRESENT' || (record.punchIn && !record.punchOut)
    ).length;
    
    return Math.round((presentCount / todayRecords.length) * 100);
  }, [attendanceRecords]);

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

  // Calculate dynamic task data
  const taskData = useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map((week, index) => ({
      week,
      completed: Math.floor(completedTasks * (0.2 + index * 0.1)), // Distribute completed tasks
      pending: Math.floor(activeTasks * (0.3 - index * 0.05)) // Distribute pending tasks
    }));
  }, [completedTasks, activeTasks]);

  // Dynamic performance data based on team members
  const performanceData = useMemo(() => {
    const dataSource = employees.length > 0 ? employees : MOCK_EMPLOYEES;
    return dataSource.slice(0, 5).map((emp, index) => ({
      name: (emp.firstName || emp.name || 'Employee').split(' ')[0], // First name only
      productivity: 75 + Math.floor(Math.random() * 25) // Random productivity 75-100
    }));
  }, [employees]);

  return (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Team Members" value={teamMembers} icon={Users} trend="up" subtext="2 new" color="blue" delay={0} />
      <StatCard title="Active Tasks" value={activeTasks} icon={Layers} trend="up" subtext="5 more" color="purple" delay={100} />
      <StatCard title="Completed Tasks" value={completedTasks} icon={CheckCircle} trend="up" subtext="18% up" color="green" delay={200} />
      <StatCard title="Team Attendance" value={`${teamAttendance}%`} icon={Calendar} trend="down" subtext="2% down" color="orange" delay={300} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
                <CardTitle className="text-base">Task Progress</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Completed vs Pending</p>
            </div>
            <Button size="xs" variant="outline">View Tasks</Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="completed" fill="#2563EB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" fill="#BFDBFE" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
                <CardTitle className="text-base">Team Performance</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Productivity Score</p>
            </div>
            <Button size="xs" variant="outline">Details</Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="productivity" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <CardTitle className="text-base">Team Members</CardTitle>
            <Button variant="ghost" size="xs" onClick={() => navigate('/employees')}>View All</Button>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {(employees.length > 0 ? employees : MOCK_EMPLOYEES).slice(0, 4).map(emp => (
                        <TableRow key={emp.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <img src={emp.avatar || emp.profilePic || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-full border-2 border-slate-100 shadow-sm" alt=""/>
                                    <span className="text-sm font-semibold text-slate-900">{emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-sm font-medium text-slate-600">{emp.designation}</TableCell>
                            <TableCell className="py-4 text-sm font-semibold text-slate-900">7/10</TableCell>
                            <TableCell className="py-4"><span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold">Active</span></TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="pb-4 border-b"><CardTitle className="text-base">Manager Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-4">
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200">
                <Target size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Assign Task</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-200">
                <TrendingUp size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Performance</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200">
                <Users size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Team Report</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-200">
                <Calendar size={20} className="mb-2" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-center">Schedule</span>
            </button>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-base">Employees in Office</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Employees who punched in at the office</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Check In</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {insideOffice.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-slate-500 py-6">
                    {isAttendanceLoading ? 'Loading…' : 'No employees currently punched in at the office.'}
                  </TableCell>
                </TableRow>
              ) : (
                insideOffice.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{(record.employee?.firstName || 'Unknown') + ' ' + (record.employee?.lastName || '')}</TableCell>
                    <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-base">Employees Outside</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Employees who punched in outside the office</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Check In</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {outsideOffice.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-slate-500 py-6">
                    {isAttendanceLoading ? 'Loading…' : 'No employees currently punched in outside the office.'}
                  </TableCell>
                </TableRow>
              ) : (
                outsideOffice.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{(record.employee?.firstName || 'Unknown') + ' ' + (record.employee?.lastName || '')}</TableCell>
                    <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-base">Employees Working from Home</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Employees with approved WFH requests</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Check In</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {wfhEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-slate-500 py-6">
                    {isAttendanceLoading ? 'Loading…' : 'No employees currently working from home.'}
                  </TableCell>
                </TableRow>
              ) : (
                wfhEmployees.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{(record.employee?.firstName || 'Unknown') + ' ' + (record.employee?.lastName || '')}</TableCell>
                    <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-base">Attendance History</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Most recent punches for all employees</p>
        </div>
        <Button size="xs" variant="outline">View All</Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Total Hours</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {recentAttendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-slate-500 py-6">
                  {isAttendanceLoading ? 'Loading…' : 'No attendance records found.'}
                </TableCell>
              </TableRow>
            ) : (
              recentAttendance.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {(record.employee?.firstName || 'Unknown') + ' ' + (record.employee?.lastName || '')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-slate-600">
                    {new Date(record.date).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell className="py-4 text-sm font-medium text-slate-900">
                    {record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </TableCell>
                  <TableCell className="py-4 text-sm font-medium text-slate-900">
                    {record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      record.locationStatus === 'OFFICE' ? 'bg-blue-100 text-blue-700' :
                      record.locationStatus === 'OUTSIDE' ? 'bg-orange-100 text-orange-700' :
                      record.locationStatus === 'WFH' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {record.locationStatus || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-sm font-semibold text-slate-900">
                    {record.totalHours ? `${record.totalHours}h` : '--'}
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

export default ManagerDashboard;
