import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell 
} from '../../components/ui/components';
import { 
  ArrowLeft, Mail, Phone, Calendar, DollarSign, 
  Briefcase, Download, Edit 
} from 'lucide-react';

const EmployeeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState<any | null>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [payroll, setPayroll] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const empId = id;
        setLoading(true);
        setError(null);

        ApiService.getEmployeeById(empId as string)
            .then((data) => {
                if (!mounted) return;
                setEmployee(data);

                // attendance endpoint expects employee id (employee id or user id)
                const lookupId = data?.id ?? data?.user?.id ?? empId;
                return ApiService.getEmployeeAttendance(Number(lookupId));
            })
            .then((att) => {
                if (!mounted) return;
                setAttendance(att || []);
            })
            .catch((err) => {
                if (!mounted) return;
                console.error(err);
                setError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-500">Loading employee details...</div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                 <h2 className="text-xl font-semibold text-slate-800">Employee Not Found</h2>
                 <p className="text-slate-500 mb-4">{error ?? 'The employee you are looking for does not exist or has been removed.'}</p>
                 <Button onClick={() => navigate('/employees')} variant="outline">
                        <ArrowLeft size={16} className="mr-2"/> Back to List
                 </Button>
            </div>
        );
    }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate('/employees')} className="w-fit pl-0 hover:bg-transparent hover:text-blue-600 text-slate-500">
          <ArrowLeft className="mr-2" size={16} /> Back to Employees
        </Button>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-6">
                <img 
                  src={employee.avatar} 
                  alt={employee.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm" 
                />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{employee.firstName ? `${employee.firstName} ${employee.lastName || ''}`.trim() : employee.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-slate-500 mt-2 text-sm">
                        <span className="flex items-center gap-1"><Briefcase size={14} /> {employee.designation ?? employee.jobTitle}</span>
                        <span className="hidden sm:inline mx-1">•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{employee.department}</span>
                    </div>
                </div>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
                 <Button variant="outline" className="flex-1 md:flex-none">
                    <Download size={16} className="mr-2" /> Resume
                 </Button>
                 <Button className="flex-1 md:flex-none">
                    <Edit size={16} className="mr-2" /> Edit
                 </Button>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal Info */}
          <div className="space-y-6">
              <Card>
                  <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Mail size={18}/></div>
                          <div className="overflow-hidden">
                              <p className="text-xs text-slate-500">Email Address</p>
                              <p className="text-sm font-medium truncate" title={employee.user?.email ?? employee.email}>{employee.user?.email ?? employee.email}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0"><Phone size={18}/></div>
                          <div>
                              <p className="text-xs text-slate-500">Phone</p>
                              <p className="text-sm font-medium">{employee.phone ?? employee.contactNumber ?? '-'}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><Calendar size={18}/></div>
                          <div>
                              <p className="text-xs text-slate-500">Joining Date</p>
                              <p className="text-sm font-medium">{employee.joinDate ?? (employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-')}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0"><DollarSign size={18}/></div>
                          <div>
                              <p className="text-xs text-slate-500">Salary</p>
                              <p className="text-sm font-medium">{employee.salary ? `$${employee.salary.toLocaleString()}/yr` : '-'}</p>
                          </div>
                      </div>
                      <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-sm text-slate-500">Employment Status</span>
                          <Badge variant={employee.user?.isActive ? 'success' : 'danger'}>
                              {employee.user?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                      </div>
                  </CardContent>
              </Card>

              {/* Leave Stats Summary */}
              <Card>
                  <CardHeader><CardTitle>Leave Balance</CardTitle></CardHeader>
                  <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50/50 rounded-xl text-center border border-blue-100">
                                <p className="text-2xl font-bold text-blue-700">12</p>
                                <p className="text-xs font-medium text-blue-600 mt-1">Total Allocated</p>
                            </div>
                            <div className="p-4 bg-green-50/50 rounded-xl text-center border border-green-100">
                                <p className="text-2xl font-bold text-green-700">8.5</p>
                                <p className="text-xs font-medium text-green-600 mt-1">Available</p>
                            </div>
                        </div>
                  </CardContent>
              </Card>
          </div>

          {/* Right Column: Records */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Recent Attendance */}
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle>Recent Attendance</CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">View History</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Check In</TableHead>
                                  <TableHead>Check Out</TableHead>
                                  <TableHead>Hours</TableHead>
                                  <TableHead>Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <tbody>
                              {attendance.length > 0 ? attendance.slice(0, 5).map(a => (
                                  <TableRow key={a.id}>
                                      <TableCell className="font-medium">{a.date}</TableCell>
                                      <TableCell>{a.checkIn || '-'}</TableCell>
                                      <TableCell>{a.checkOut || '-'}</TableCell>
                                      <TableCell>{a.totalHours > 0 ? `${a.totalHours}h` : '-'}</TableCell>
                                      <TableCell>
                                          <Badge variant={a.status === 'Present' ? 'success' : a.status === 'Absent' ? 'danger' : 'default'}>
                                              {a.status}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No attendance records found.</TableCell></TableRow>
                              )}
                          </tbody>
                      </Table>
                  </CardContent>
              </Card>

              {/* Leave History */}
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle>Leave History</CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">Apply Leave</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Dates</TableHead>
                                  <TableHead>Reason</TableHead>
                                  <TableHead>Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <tbody>
                              {leaves.length > 0 ? leaves.map(l => (
                                  <TableRow key={l.id}>
                                      <TableCell>{l.type}</TableCell>
                                      <TableCell className="text-xs">{l.startDate} - {l.endDate}</TableCell>
                                      <TableCell className="max-w-xs truncate text-slate-500">{l.reason}</TableCell>
                                      <TableCell>
                                          <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}>
                                              {l.status}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No leave history found.</TableCell></TableRow>
                              )}
                          </tbody>
                      </Table>
                  </CardContent>
              </Card>

              {/* Payroll */}
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle>Payroll History</CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">View All Slips</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Month</TableHead>
                                  <TableHead>Basic</TableHead>
                                  <TableHead>Allowances</TableHead>
                                  <TableHead>Net Pay</TableHead>
                                  <TableHead>Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <tbody>
                              {payroll.length > 0 ? payroll.map(p => (
                                  <TableRow key={p.id}>
                                      <TableCell className="font-medium">{p.month} {p.year}</TableCell>
                                      <TableCell>${p.basic.toLocaleString()}</TableCell>
                                      <TableCell>${p.allowances.toLocaleString()}</TableCell>
                                      <TableCell className="font-bold text-slate-900">${p.netPay.toLocaleString()}</TableCell>
                                      <TableCell>
                                          <Badge variant={p.status === 'Processed' ? 'success' : 'warning'}>{p.status}</Badge>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No payroll records available.</TableCell></TableRow>
                              )}
                          </tbody>
                      </Table>
                  </CardContent>
              </Card>

          </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;