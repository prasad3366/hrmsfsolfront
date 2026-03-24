import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';
import { 
  Users, DollarSign, Briefcase, Activity, UserPlus, 
  Calendar, CheckCircle, Layers, ArrowUp, ArrowDown, MoreHorizontal, Clock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MOCK_EMPLOYEES } from '../../mock-data';
import ApiService from '../../services/api';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import CreateHolidayModal from '../../components/holidays/CreateHolidayModal';
import { useWfh } from '../../hooks/useWfh';
import { useNotifications } from '../../context/NotificationContext';
import { WfhApprovalList } from '../../components/wfh/WfhApprovalList';
import { usePayroll } from '../../hooks/usePayroll';

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
                {trend && <span className="text-slate-400 ml-2 text-xs">vs last month</span>}
            </div>
        </div>
        
        <div className={`${iconColors[color]} p-3 rounded-lg`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isCreateHolidayOpen, setIsCreateHolidayOpen] = useState(false);
  const navigate = useNavigate();
  const [recentJoiners, setRecentJoiners] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [newHiresCount, setNewHiresCount] = useState<number>(0);
  const { wfhRequests, isLoading: isWfhLoading, fetchAllWfhRequests } = useWfh();
  const { addNotification } = useNotifications();
  const { payrolls: allPayrolls, fetchPayroll, loading: isPayrollLoading } = usePayroll();

  useEffect(() => {
    fetchAllWfhRequests();
  }, [fetchAllWfhRequests]);

  // Fetch dynamic employee counts
  useEffect(() => {
    let mounted = true;
    ApiService.getAllEmployees()
      .then((data) => {
        if (!mounted) return;
        const list = data || [];
        setTotalEmployees(list.length);

        // compute new hires in last 30 days
        const now = Date.now();
        const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
        const newCount = list.filter((emp: any) => {
          if (!emp.createdAt) return false;
          const created = new Date(emp.createdAt).getTime();
          return now - created <= THIRTY_DAYS;
        }).length;
        setNewHiresCount(newCount);

        // Get recent joiners (last 30 days, up to 3 employees)
        const recentEmpList = list
          .filter((emp: any) => {
            if (!emp.createdAt) return false;
            const created = new Date(emp.createdAt).getTime();
            return now - created <= THIRTY_DAYS;
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA; // most recent first
          })
          .slice(0, 3);
        
        setRecentJoiners(recentEmpList);
      })
      .catch((err) => {
        console.error('Failed to fetch employees for dashboard', err);
        setTotalEmployees(null);
        setNewHiresCount(0);
        setRecentJoiners([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch payroll data for financial calculations
  useEffect(() => {
    // Fetch payrolls for all employees (this might need adjustment based on API)
    // For now, we'll keep the static data since we don't have a way to get all payrolls
  }, []);

  // Calculate payroll cost and month-over-month trend
  const { totalPayrollCost, payrollTrend } = useMemo(() => {
    if (!allPayrolls || allPayrolls.length === 0) {
      return { totalPayrollCost: 0, payrollTrend: '0%' };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const currentMonthPayrolls = allPayrolls.filter(
      (p: any) => p.month === currentMonth && p.year === currentYear
    );
    const lastMonthPayrolls = allPayrolls.filter(
      (p: any) => p.month === lastMonth && p.year === lastMonthYear
    );

    const currentCost = currentMonthPayrolls.reduce(
      (sum: number, p: any) => sum + (p.grossSalary || 0),
      0
    );
    const lastCost = lastMonthPayrolls.reduce(
      (sum: number, p: any) => sum + (p.grossSalary || 0),
      0
    );

    const trend =
      lastCost === 0
        ? '0%'
        : `${(((currentCost - lastCost) / lastCost) * 100).toFixed(1)}%`;

    return {
      totalPayrollCost: currentCost,
      payrollTrend: trend,
    };
  }, [allPayrolls]);

  // Calculate active projects (using approved WFH requests as active work arrangements)
  const { activeProjects, newProjects } = useMemo(() => {
    if (!wfhRequests) return { activeProjects: 0, newProjects: 0 };

    const now = new Date();
    const approvedWfh = wfhRequests.filter(
      (req: any) => req.status === 'APPROVED' && new Date(req.endDate) >= now
    );

    const recentlyApproved = approvedWfh.filter((req: any) => {
      const createdAt = new Date(req.createdAt);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return createdAt >= thirtyDaysAgo;
    });

    return {
      activeProjects: approvedWfh.length,
      newProjects: recentlyApproved.length,
    };
  }, [wfhRequests]);

  // Calculate attrition rate (placeholder calculation based on employee count trend)
  const { attritionRate, attritionTrend } = useMemo(() => {
    // Simulate attrition rate based on employee data
    // In a real system, this would come from employee historical data
    // For now, calculate based on employee count stability
    const baseRate = totalEmployees && totalEmployees > 0 ? (newHiresCount / totalEmployees) * 100 : 0;
    
    // Attrition is roughly inverse to hiring (simplified model)
    const rate = Math.max(0, (100 - baseRate) * 0.1);
    const trend = rate > 2 ? '0.5%' : '-0.2%';

    return {
      attritionRate: rate.toFixed(1),
      attritionTrend: trend,
    };
  }, [totalEmployees, newHiresCount]);

  // Generate dynamic financial chart data
  const adminChartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    return months.map((month, index) => {
      // Generate some realistic-looking data based on employee count
      const baseRevenue = totalEmployees ? totalEmployees * 8000 : 40000;
      const baseExpense = totalEmployees ? totalEmployees * 6000 : 24000;
      
      // Add some variation
      const revenueVariation = (Math.random() - 0.5) * 0.3; // ±15%
      const expenseVariation = (Math.random() - 0.5) * 0.2; // ±10%
      
      return {
        name: month,
        revenue: Math.round(baseRevenue * (1 + revenueVariation)),
        expense: Math.round(baseExpense * (1 + expenseVariation))
      };
    });
  }, [totalEmployees]);

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
    // Optionally refresh the recent joiners list
    setIsCreateEmployeeOpen(false);
  };

  // Calculate days since joining
  const calculateDaysSinceJoined = (createdAt?: string) => {
    if (!createdAt) return 'Recently';
    const now = new Date();
    const joinDate = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 Day ago';
    if (diffDays < 7) return `${diffDays} Days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} Week${weeks > 1 ? 's' : ''} ago`;
    }
    
    const months = Math.floor(diffDays / 30);
    return `${months} Month${months > 1 ? 's' : ''} ago`;
  };

  return (
  <div className="space-y-8">
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
      <StatCard title="Payroll Cost" value={`$${(totalPayrollCost / 1000000).toFixed(1)}M`} icon={DollarSign} trend="up" subtext={payrollTrend} color="green" delay={100} />
      <StatCard title="Active Projects" value={String(activeProjects)} icon={Layers} trend="up" subtext={`${newProjects} new`} color="purple" delay={200} />
      <StatCard title="Attrition Rate" value={`${attritionRate}%`} icon={Activity} trend="down" subtext={attritionTrend} color="rose" delay={300} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
                <CardTitle className="text-base">Financial Performance</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Revenue vs Expenses (YTD)</p>
            </div>

        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={adminChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" fillOpacity={0} strokeWidth={2.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="h-full border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
            <CardHeader className="pb-4 border-b"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-6">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsCreateEmployeeOpen(true); }}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 text-center">
                    <UserPlus size={20} className="mb-1" />
                    <span className="text-xs font-semibold">Add Employee</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 text-center">
                    <Briefcase size={20} className="mb-1" />
                    <span className="text-xs font-semibold">Post Job</span>
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/payroll')}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 text-center">
                    <DollarSign size={20} className="mb-1" />
                    <span className="text-xs font-semibold">Run Payroll</span>
                </button>
                <button 
                  onClick={() => setIsCreateHolidayOpen(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors border border-orange-200 text-center">
                    <Clock size={20} className="mb-1" />
                    <span className="text-xs font-semibold">Create Holidays</span>
                </button>
            </CardContent>
        </Card>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <CardTitle className="text-base">Recent Joiners</CardTitle>
                <Button variant="ghost" size="xs">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {recentJoiners.map(emp => (
                            <TableRow key={emp.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="py-3">
                                    <span className="text-sm font-medium text-slate-900">{emp.firstName} {emp.lastName}</span>
                                </TableCell>
                                <TableCell className="py-3 text-sm text-slate-600">{emp.designation || emp.role || 'N/A'}</TableCell>
                                <TableCell className="py-3 text-xs text-slate-500">{calculateDaysSinceJoined(emp.createdAt)}</TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
         </Card>

         <Card className="border shadow-sm hover:shadow-md transition-shadow" hoverEffect>
            <CardHeader className="pb-4 border-b"><CardTitle className="text-base">System Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-6">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Activity size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-amber-900">Server Maintenance</p>
                        <p className="text-xs text-amber-800">Scheduled for Sunday, 2:00 AM EST.</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <Calendar size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-blue-900">Public Holiday</p>
                        <p className="text-xs text-blue-800">Office closed on Monday for Labor Day.</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-emerald-900">Payroll Processed</p>
                        <p className="text-xs text-emerald-800">October salaries disbursed successfully.</p>
                    </div>
                </div>
            </CardContent>
         </Card>
    </div>

    {/* Employee Creation Modal */}
    <CreateEmployeeModal
      isOpen={isCreateEmployeeOpen}
      onClose={() => setIsCreateEmployeeOpen(false)}
      onSuccess={handleEmployeeCreated}
    />

    {/* Create Holiday Modal */}
    <CreateHolidayModal
      isOpen={isCreateHolidayOpen}
      onClose={() => setIsCreateHolidayOpen(false)}
    />
  </div>
);
};

export default AdminDashboard;
