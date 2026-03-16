import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';
import { 
  Users, Layers, CheckCircle, Calendar, TrendingUp, ArrowUp, ArrowDown, Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { MOCK_EMPLOYEES } from '../../mock-data';

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

const taskData = [
  { week: 'Week 1', completed: 24, pending: 8 },
  { week: 'Week 2', completed: 28, pending: 6 },
  { week: 'Week 3', completed: 32, pending: 5 },
  { week: 'Week 4', completed: 35, pending: 4 },
];

const performanceData = [
  { name: 'John', productivity: 85 },
  { name: 'Sarah', productivity: 92 },
  { name: 'Mike', productivity: 78 },
  { name: 'Emma', productivity: 88 },
  { name: 'Alex', productivity: 95 },
];

const ManagerDashboard = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Team Members" value="12" icon={Users} trend="up" subtext="2 new" color="blue" delay={0} />
      <StatCard title="Active Tasks" value="34" icon={Layers} trend="up" subtext="5 more" color="purple" delay={100} />
      <StatCard title="Completed Tasks" value="128" icon={CheckCircle} trend="up" subtext="18% up" color="green" delay={200} />
      <StatCard title="Team Attendance" value="88%" icon={Calendar} trend="down" subtext="2% down" color="orange" delay={300} />
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
            <Button variant="ghost" size="xs">View All</Button>
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
                    {MOCK_EMPLOYEES.slice(0, 4).map(emp => (
                        <TableRow key={emp.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <img src={emp.avatar} className="w-8 h-8 rounded-full border-2 border-slate-100 shadow-sm" alt=""/>
                                    <span className="text-sm font-semibold text-slate-900">{emp.name}</span>
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
  </div>
);

export default ManagerDashboard;
