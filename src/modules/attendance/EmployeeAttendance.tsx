import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import ApiService, { AttendanceRecord, Employee360Leave, MonthlyAttendanceSummary } from '../../services/api';
import attendanceService from '../../services/attendanceService';
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';

type AttendanceFilter = 'ALL' | 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
type AttendanceRecordPayload = Partial<AttendanceRecord> & {
  attendanceDate?: string | null;
  attendanceStatus?: string | null;
  clockIn?: string | null;
  clockOut?: string | null;
  data?: unknown;
  records?: unknown;
  history?: unknown;
};

const extractAttendanceRecords = (payload: unknown): AttendanceRecordPayload[] => {
  if (Array.isArray(payload)) return payload as AttendanceRecordPayload[];
  if (!payload || typeof payload !== 'object') return [];

  const response = payload as AttendanceRecordPayload;
  for (const nestedPayload of [response.data, response.records, response.history]) {
    const records = extractAttendanceRecords(nestedPayload);
    if (records.length > 0) return records;
  }

  return [];
};

const normalizeAttendanceRecords = (payload: unknown): AttendanceRecord[] => (
  extractAttendanceRecords(payload).map((record) => ({
    ...record,
    date: record.date || record.attendanceDate || '',
    status: (record.status || record.attendanceStatus || '') as AttendanceRecord['status'],
    punchIn: record.punchIn || record.clockIn || '',
    punchOut: record.punchOut || record.clockOut || null,
  })) as AttendanceRecord[]
);

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
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('ALL');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<Employee360Leave['recentHistory']>([]);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEmployee) {
      setEmployees([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const loadEmployees = () => attendanceService.getAttendanceEmployees(searchTerm)
      .then((res) => {
        const employeeList = Array.isArray(res) ? res : (res.data || []);
        if (mounted) setEmployees(employeeList);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load employees');
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    if (!searchTerm.trim()) {
      loadEmployees();
      return () => {
        mounted = false;
      };
    }

    const debounceTimer = window.setTimeout(loadEmployees, 300);
    return () => {
      window.clearTimeout(debounceTimer);
      mounted = false;
    };
  }, [searchTerm, selectedEmployee]);

  const getEmployeeName = (employee: any) => (
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name || employee.empCode || 'Unknown'
  );

  const filteredEmployees = useMemo(() => {
    if (selectedEmployee) return [];
    return employees;
  }, [employees, selectedEmployee]);

  const handleSelectEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setAttendanceRecords([]);
    setAttendanceError(null);
    setSummary(null);
    setSummaryError(null);
    setAttendanceFilter('ALL');
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

    const [yearText, monthText] = selectedMonth.split('-');
    const month = Number(monthText);
    const year = Number(yearText);

    ApiService.getEmployeeAttendance(numericEmployeeId, month, year)
      .then((response) => {
        console.log('API Attendance Response:', response);
        if (mounted) setAttendanceRecords(normalizeAttendanceRecords(response));
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
  }, [selectedEmployeeId, selectedMonth]);

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

    ApiService.getEmployee360Leave(numericEmployeeId)
      .then((data) => {
        if (!mounted) return;

        setLeaveRecords(data?.recentHistory || []);
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
    const normalizedStatus = status?.toUpperCase();
    if (normalizedStatus === 'PRESENT') return 'success';
    if (normalizedStatus === 'ABSENT') return 'danger';
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

  const filteredRecords = useMemo(() => attendanceRecords
    .filter((record) => {
      const recordDate = new Date(record.date);
      const recordMonth =
        `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
      const recordStatus = String(
        record.status || (record as AttendanceRecord & { attendanceStatus?: string }).attendanceStatus || '',
      ).toUpperCase();

      return recordMonth === selectedMonth
        && (attendanceFilter === 'ALL' || recordStatus === attendanceFilter.toUpperCase());
    })
    .sort((firstRecord, secondRecord) => (
      new Date(firstRecord.date).getTime() - new Date(secondRecord.date).getTime()
    )), [attendanceRecords, selectedMonth, attendanceFilter]);

  const toggleAttendanceFilter = (filter: Exclude<AttendanceFilter, 'ALL'>) => {
    setAttendanceFilter((currentFilter) => currentFilter === filter ? 'ALL' : filter);
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
                    setAttendanceFilter('ALL');
                setLeaveRecords([]);
                setLeaveError(null);
              }}>
                Change Employee
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedEmployee && !isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {searchTerm.trim() ? 'Matching Employees' : 'Employee Attendance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEmployees.length === 0 ? (
              <p className="text-sm text-slate-500">
                {searchTerm.trim() ? 'No matching employees found.' : 'No employees are available in your authorized scope.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <button
                    type="button"
                    key={employee.id || employee.employeeId || employee.empCode}
                    onClick={() => handleSelectEmployee(employee)}
                    className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-slate-50"
                  >
                    <span>
                      <span className="block font-medium text-slate-900">{getEmployeeName(employee)}</span>
                      <span className="block text-xs text-slate-500">ID: {employee.empCode || employee.employeeId || employee.id || '-'}</span>
                    </span>
                    {employee.designation && (
                      <span className="ml-4 text-xs text-slate-500">{employee.designation}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                      onChange={(event) => {
                        setSelectedMonth(event.target.value);
                        setAttendanceFilter('ALL');
                      }}
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Working Days</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">{summary.workingDays}</p>
                  </div>
                  {([
                    ['Present', summary.presentDays, 'PRESENT', 'text-emerald-600', 'bg-emerald-50'],
                    ['Half Day', summary.halfDays, 'HALF_DAY', 'text-amber-600', 'bg-amber-50'],
                    ['Absent', summary.absentDays, 'ABSENT', 'text-rose-600', 'bg-rose-50'],
                    ['Leave', summary.leaveDays, 'LEAVE', 'text-blue-600', 'bg-blue-50'],
                  ] as const).map(([label, value, filter, color, bgClass]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => toggleAttendanceFilter(filter)}
                      aria-pressed={attendanceFilter === filter}
                      className={`cursor-pointer rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${bgClass} ${attendanceFilter === filter ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                      <p className={`mt-3 text-2xl font-bold ${color}`}>{value}</p>
                    </button>
                  ))}
                  <div className="rounded-xl border border-slate-200 bg-violet-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Attendance %</p>
                    <p className="mt-3 text-2xl font-bold text-violet-600">{summary.attendancePercentage}%</p>
                  </div>
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
              ) : filteredRecords.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  <p>No attendance records found for this filter.</p>
                  {attendanceFilter !== 'ALL' && (
                    <button type="button" onClick={() => setAttendanceFilter('ALL')} className="mt-2 font-semibold text-blue-600 hover:text-blue-700">
                      Reset Filter / View All
                    </button>
                  )}
                </div>
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
                    {(() => {
                      console.log(filteredRecords);
                      return null;
                    })()}
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={attendanceStatusVariant(
                              record.status || (record as AttendanceRecord & { attendanceStatus?: string }).attendanceStatus || '',
                            )}
                          >
                            {record.status || (record as AttendanceRecord & { attendanceStatus?: string }).attendanceStatus || 'N/A'}
                          </Badge>
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
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {leaveRecords.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>{leave.leaveType || '—'}</TableCell>
                        <TableCell>{formatDate(leave.startDate)}</TableCell>
                        <TableCell>{formatDate(leave.endDate)}</TableCell>
                        <TableCell>{leave.totalDays}</TableCell>
                        <TableCell>{formatDurationType(leave.durationType)}</TableCell>
                        <TableCell>
                          <Badge variant={leaveStatusVariant(leave.status)}>{leave.status}</Badge>
                        </TableCell>
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
