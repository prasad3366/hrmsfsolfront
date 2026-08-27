import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import ApiService, { AttendanceRecord, Leave, MonthlyAttendanceSummary } from '../../services/api';
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';

const EmployeeAttendance = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<Leave[]>([]);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    ApiService.getAllEmployees()
      .then((data) => {
        if (mounted) setEmployees(data || []);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load employees');
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getEmployeeName = (employee: any) => (
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name || employee.empCode || 'Unknown'
  );

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query || selectedEmployee) return [];

    return employees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase();
      const firstName = String(employee.firstName || '').toLowerCase();
      const lastName = String(employee.lastName || '').toLowerCase();
      const empCode = String(employee.empCode || employee.employeeId || employee.id || '').toLowerCase();

      return name.includes(query) || firstName.includes(query) || lastName.includes(query) || empCode.includes(query);
    });
  }, [employees, searchTerm, selectedEmployee]);

  const handleSelectEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setAttendanceRecords([]);
    setAttendanceError(null);
    setSummary(null);
    setSummaryError(null);
    setLeaveRecords([]);
    setLeaveError(null);
  };

  const selectedEmployeeId = selectedEmployee?.id;
  const employeeId = selectedEmployee?.empCode || selectedEmployeeId || '-';

  useEffect(() => {
    if (selectedEmployeeId === undefined || selectedEmployeeId === null) {
      setAttendanceRecords([]);
      setAttendanceError(null);
      setIsAttendanceLoading(false);
      return;
    }

    const numericEmployeeId = Number(selectedEmployeeId);
    if (!Number.isFinite(numericEmployeeId)) {
      setAttendanceRecords([]);
      setAttendanceError('Selected employee has an invalid database ID.');
      setIsAttendanceLoading(false);
      return;
    }

    let mounted = true;
    setAttendanceRecords([]);
    setAttendanceError(null);
    setIsAttendanceLoading(true);

    ApiService.getEmployeeAttendance(numericEmployeeId)
      .then((data) => {
        if (mounted) setAttendanceRecords(data || []);
      })
      .catch((err) => {
        if (mounted) {
          setAttendanceError(err instanceof Error ? err.message : 'Failed to load attendance records');
        }
      })
      .finally(() => {
        if (mounted) setIsAttendanceLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (selectedEmployeeId === undefined || selectedEmployeeId === null) {
      setSummary(null);
      setSummaryError(null);
      setIsSummaryLoading(false);
      return;
    }

    const numericEmployeeId = Number(selectedEmployeeId);
    if (!Number.isInteger(numericEmployeeId) || numericEmployeeId < 1 || !selectedMonth) {
      setSummary(null);
      setSummaryError('Selected employee or month is invalid.');
      setIsSummaryLoading(false);
      return;
    }

    let mounted = true;
    setSummary(null);
    setSummaryError(null);
    setIsSummaryLoading(true);

    ApiService.getEmployeeAttendanceSummary(numericEmployeeId, selectedMonth)
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch((err) => {
        if (mounted) {
          setSummaryError(err instanceof Error ? err.message : 'Failed to load attendance summary');
        }
      })
      .finally(() => {
        if (mounted) setIsSummaryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedEmployeeId, selectedMonth]);

  useEffect(() => {
    if (selectedEmployeeId === undefined || selectedEmployeeId === null) {
      setLeaveRecords([]);
      setLeaveError(null);
      setIsLeaveLoading(false);
      return;
    }

    const numericEmployeeId = Number(selectedEmployeeId);
    if (!Number.isFinite(numericEmployeeId)) {
      setLeaveRecords([]);
      setLeaveError('Selected employee has an invalid database ID.');
      setIsLeaveLoading(false);
      return;
    }

    let mounted = true;
    setLeaveRecords([]);
    setLeaveError(null);
    setIsLeaveLoading(true);

    ApiService.getEmployeeById(numericEmployeeId)
      .then((data) => {
        if (!mounted) return;

        const rawLeaves = Array.isArray(data?.leaves) ? data.leaves : [];
        const employeeLeaves = rawLeaves.filter((leave: any) => {
          const leaveEmployeeId = Number(leave.employeeId ?? leave.employee?.id ?? data?.id ?? selectedEmployeeId);
          return Number.isFinite(leaveEmployeeId) && leaveEmployeeId === numericEmployeeId;
        });

        setLeaveRecords(employeeLeaves as Leave[]);
      })
      .catch((err) => {
        if (mounted) {
          setLeaveError(err instanceof Error ? err.message : 'Failed to load leave details');
        }
      })
      .finally(() => {
        if (mounted) setIsLeaveLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedEmployeeId]);

  const attendanceStatusVariant = (status: string) => {
    if (status === 'PRESENT') return 'success';
    if (status === 'ABSENT') return 'danger';
    return 'warning';
  };

  const leaveStatusVariant = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'danger';
    if (status === 'PENDING') return 'warning';
    return 'default';
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const formatDurationType = (value?: string | null) => {
    if (!value) return '-';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employee Attendance &amp; Leave Report</h1>
        <p className="text-slate-500 mt-2">Search for an employee to view their attendance and leave information.</p>
      </div>

      <Card hoverEffect>
        <CardHeader>
          <CardTitle className="text-base">Employee Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search employee by ID or name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
              aria-label="Search employee by ID or name"
            />
          </div>

          {isLoading && (
            <p className="mt-3 text-sm text-slate-500">Loading employees...</p>
          )}

          {error && (
            <p className="mt-3 text-sm text-rose-600">{error}</p>
          )}

          {!isLoading && !error && searchTerm.trim() && !selectedEmployee && (
            <div className="mt-3 max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <button
                    type="button"
                    key={employee.id || employee.employeeId || employee.empCode}
                    onClick={() => handleSelectEmployee(employee)}
                    className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                  >
                    <span>
                      <span className="block font-medium text-slate-900">{getEmployeeName(employee)}</span>
                      <span className="block text-xs text-slate-500">ID: {employee.empCode || employee.employeeId || employee.id || '-'}</span>
                    </span>
                    {employee.designation && (
                      <span className="ml-4 text-xs text-slate-500">{employee.designation}</span>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-slate-500">No matching employees found.</p>
              )}
            </div>
          )}

          {selectedEmployee && (
            <div className="mt-4 flex max-w-xl items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{getEmployeeName(selectedEmployee)}</p>
                <p className="text-sm text-slate-600">Employee ID: {employeeId}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setSelectedEmployee(null);
                setAttendanceRecords([]);
                setAttendanceError(null);
                setSummary(null);
                setSummaryError(null);
                setLeaveRecords([]);
                setLeaveError(null);
              }}>
                Change Employee
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Selected Employee</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">{getEmployeeName(selectedEmployee)}</h2>
                  <Badge variant="blue">Employee ID: {employeeId}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <CalendarDays size={16} className="text-slate-400" />
                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">Month</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    aria-label="Select attendance month"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">{selectedEmployee.designation || 'Designation not available'}</span>
            </div>
          </div>

          <Card hoverEffect>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading monthly summary...</div>
              ) : summaryError ? (
                <div className="py-8 text-center text-sm text-rose-600">{summaryError}</div>
              ) : !summary ? (
                <div className="py-8 text-center text-sm text-slate-500">No summary available for this month.</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    ['Working Days', summary.workingDays, 'text-slate-900', 'bg-slate-50'],
                    ['Present', summary.presentDays, 'text-emerald-600', 'bg-emerald-50'],
                    ['Half Day', summary.halfDays, 'text-amber-600', 'bg-amber-50'],
                    ['Absent', summary.absentDays, 'text-rose-600', 'bg-rose-50'],
                    ['Leave', summary.leaveDays, 'text-blue-600', 'bg-blue-50'],
                    ['Attendance %', `${summary.attendancePercentage}%`, 'text-violet-600', 'bg-violet-50'],
                  ].map(([label, value, color, bgClass]) => (
                    <div key={label} className={`rounded-xl border border-slate-200 ${bgClass} p-4`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                      <p className={`mt-3 text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card hoverEffect>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {isAttendanceLoading ? (
                <div className="p-6 text-center text-sm text-slate-500">Loading attendance records...</div>
              ) : attendanceError ? (
                <div className="p-6 text-center text-sm text-rose-600">{attendanceError}</div>
              ) : attendanceRecords.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No attendance records found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Total hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={attendanceStatusVariant(record.status)}>{record.status}</Badge>
                        </TableCell>
                        <TableCell>{record.punchIn ? new Date(record.punchIn).toLocaleTimeString() : '-'}</TableCell>
                        <TableCell>{record.punchOut ? new Date(record.punchOut).toLocaleTimeString() : '-'}</TableCell>
                        <TableCell>{record.totalHours}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card hoverEffect>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Leave Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {isLeaveLoading ? (
                <div className="p-6 text-center text-sm text-slate-500">Loading leave details...</div>
              ) : leaveError ? (
                <div className="p-6 text-center text-sm text-rose-600">{leaveError}</div>
              ) : leaveRecords.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No leave requests found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Total Days</TableHead>
                      <TableHead>Duration Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {leaveRecords.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>{leave.leaveType?.name || '—'}</TableCell>
                        <TableCell>{formatDate(leave.startDate)}</TableCell>
                        <TableCell>{formatDate(leave.endDate)}</TableCell>
                        <TableCell>{leave.totalDays}</TableCell>
                        <TableCell>{formatDurationType(leave.durationType)}</TableCell>
                        <TableCell>
                          <Badge variant={leaveStatusVariant(leave.status)}>{leave.status}</Badge>
                        </TableCell>
                        <TableCell>{leave.reason || '-'}</TableCell>
                        <TableCell>{leave.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
