import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import ApiService, { AttendanceRecord, Employee360Leave, MonthlyAttendanceSummary } from '../../services/api';
import attendanceService from '../../services/attendanceService';
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, DataTable, EmptyState, ErrorState, PageHeader, SearchBox, Skeleton, StatCard, StatusBadge, type DataTableColumn } from '../../components/ui/components';
import { attendanceDateKey, formatAttendanceDate } from '../../utils/attendanceDate';
import { getAttendanceLocationLabel, getRecordAttendanceState } from '../../hooks/useAttendance';

type AttendanceFilter = 'ALL' | 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export const getEmployeeAttendanceLocationLabel = (
  punchInLocationStatus?: AttendanceRecord['punchInLocationStatus'],
  punchOutLocationStatus?: AttendanceRecord['punchOutLocationStatus'],
) => getAttendanceLocationLabel(punchInLocationStatus, punchOutLocationStatus);

const EmployeeAttendance = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(0);
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
    setAttendancePage(1);
    setAttendanceTotalPages(0);
    setAttendanceError(null);
    setSummary(null);
    setSummaryError(null);
    setAttendanceFilter('ALL');
    setLeaveRecords([]);
    setLeaveError(null);
  };

  const selectedEmployeeId = selectedEmployee?.id ?? selectedEmployee?.employeeId;
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
    setAttendanceTotalPages(0);
    setAttendanceError(null);
    setIsAttendanceLoading(true);

    const [yearText, monthText] = selectedMonth.split('-');
    const month = Number(monthText);
    const year = Number(yearText);

    ApiService.getEmployeeAttendance(numericEmployeeId, month, year, undefined, attendancePage, 10)
      .then((response) => {
        if (mounted) {
          setAttendanceRecords(response.data);
          setAttendanceTotalPages(response.meta.totalPages);
        }
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
  }, [selectedEmployeeId, selectedMonth, attendancePage]);

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

  const formatDate = (value?: string | null) => {
    return formatAttendanceDate(value);
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
      const recordMonth = attendanceDateKey(record.date).slice(0, 7);
      const recordStatus = getRecordAttendanceState(record);

      return recordMonth === selectedMonth
        && (attendanceFilter === 'ALL' || recordStatus === attendanceFilter.toUpperCase());
    })
    .sort((firstRecord, secondRecord) => (
      attendanceDateKey(firstRecord.date).localeCompare(attendanceDateKey(secondRecord.date))
    )), [attendanceRecords, selectedMonth, attendanceFilter]);

  const attendanceColumns: DataTableColumn<AttendanceRecord>[] = [
    { key: 'date', header: 'Date', render: (record) => <span className="font-semibold text-[#12354a]">{formatDate(record.date)}</span> },
    { key: 'status', header: 'Status', render: (record) => <StatusBadge status={record.status === 'PRESENT' ? 'success' : record.status === 'ABSENT' ? 'danger' : record.status === 'LEAVE' ? 'info' : record.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}>{record.status}</StatusBadge> },
    { key: 'punchIn', header: 'Check in', render: (record) => record.punchIn ? new Date(record.punchIn).toLocaleTimeString() : '-' },
    { key: 'punchOut', header: 'Check out', render: (record) => record.punchOut ? new Date(record.punchOut).toLocaleTimeString() : '-' },
    { key: 'totalHours', header: 'Total hours', render: (record) => record.totalHours ?? '-' },
    { key: 'location', header: 'Location', render: (record) => { const label = record.locationLabel || 'Unknown'; const tone = label === 'In Office' ? 'success' : label === 'Out of Office' ? 'danger' : label === 'Unknown' ? 'neutral' : 'warning'; return <StatusBadge status={tone}>{label}</StatusBadge>; } },
  ];

  const leaveColumns: DataTableColumn<typeof leaveRecords[number]>[] = [
    { key: 'leaveType', header: 'Leave type', render: (leave) => leave.leaveType || '-' },
    { key: 'startDate', header: 'Start date', render: (leave) => formatDate(leave.startDate) },
    { key: 'endDate', header: 'End date', render: (leave) => formatDate(leave.endDate) },
    { key: 'totalDays', header: 'Total days', render: (leave) => leave.totalDays },
    { key: 'durationType', header: 'Duration type', render: (leave) => formatDurationType(leave.durationType) },
    { key: 'status', header: 'Status', render: (leave) => <StatusBadge status={leave.status === 'APPROVED' ? 'success' : leave.status === 'REJECTED' ? 'danger' : leave.status === 'PENDING' ? 'warning' : 'neutral'}>{leave.status}</StatusBadge> },
  ];

  const toggleAttendanceFilter = (filter: Exclude<AttendanceFilter, 'ALL'>) => {
    setAttendanceFilter((currentFilter) => currentFilter === filter ? 'ALL' : filter);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Employee Attendance" description="Review attendance, location status, and leave records for an employee." />

      <Card className="overflow-hidden" hoverEffect>
        <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70">
          <CardTitle className="text-base">Select employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <SearchBox
              placeholder="Search employee by ID or name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search employee by ID or name"
            />
          </div>

          {isLoading && (
            <div className="mt-4 flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-3 w-48" /></div>
          )}

          {error && (
            <ErrorState message={error} />
          )}

          {!isLoading && !error && searchTerm.trim() && !selectedEmployee && (
            <div className="mt-3 max-w-xl overflow-hidden rounded-xl border border-[#dce6e8] bg-white shadow-[0_12px_30px_rgba(7,59,92,0.08)]">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <button
                    type="button"
                    key={employee.id || employee.employeeId || employee.empCode}
                    onClick={() => handleSelectEmployee(employee)}
                    className="flex w-full items-center justify-between border-b border-[#edf3f5] px-4 py-3 text-left transition-colors hover:bg-[#f6faf9] last:border-b-0"
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
                <EmptyState title="No matching employees" description="Try a different name or employee code." />
              )}
            </div>
          )}

          {selectedEmployee && (
            <div className="mt-4 flex max-w-xl items-center justify-between rounded-xl border border-[#cce1e8] bg-[#eaf3f7] px-4 py-3">
              <div>
                <p className="font-bold text-[#12354a]">{getEmployeeName(selectedEmployee)}</p>
                <p className="text-sm text-[#617984]">Employee ID: {employeeId}</p>
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
          <div className="relative overflow-hidden rounded-2xl border border-[#dce6e8] bg-gradient-to-br from-[#073b5c] to-[#0d526b] p-5 text-white shadow-[0_18px_42px_rgba(7,59,92,0.14)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b8d0d5]">Selected employee</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <h2 className="text-2xl font-bold text-white">{getEmployeeName(selectedEmployee)}</h2>
                  <Badge variant="blue" className="border-white/20 bg-white/10 text-white">Employee ID: {employeeId}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2 text-sm text-[#d5e6e8]">
                <CalendarDays size={16} className="text-[#e3c477]" />
                <label className="flex items-center gap-2">
                  <span className="font-medium text-[#d5e6e8]">Month</span>
                  <input
                    type="month"
                    value={selectedMonth}
                      onChange={(event) => {
                        setSelectedMonth(event.target.value);
                        setAttendancePage(1);
                        setAttendanceFilter('ALL');
                      }}
                    className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#c3a25a] focus:ring-2 focus:ring-[#b08a3e]/30"
                    aria-label="Select attendance month"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#d5e6e8]">
              <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 font-medium">{selectedEmployee.designation || 'Designation not available'}</span>
            </div>
          </div>

          <Card hoverEffect className="overflow-hidden">
            <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70 pb-3">
              <CardTitle className="text-base">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}</div>
              ) : summaryError ? (
                <div className="py-8 text-center text-sm text-[#c85d51]">{summaryError}</div>
              ) : !summary ? (
                <div className="py-8 text-center text-sm text-slate-500">No summary available for this month.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <StatCard label="Working days" value={summary.workingDays} />
                  {([
                    ['Present', summary.presentDays, 'PRESENT', 'text-emerald-600', 'bg-emerald-50'],
                    ['Half Day', summary.halfDays, 'HALF_DAY', 'text-amber-600', 'bg-amber-50'],
                    ['Absent', summary.absentDays, 'ABSENT', 'text-[#c85d51]', 'bg-[#fff1ef]'],
                    ['Leave', summary.leaveDays, 'LEAVE', 'text-[#1e627d]', 'bg-[#eaf3f7]'],
                  ] as const).map(([label, value, filter, color, bgClass]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => toggleAttendanceFilter(filter)}
                      aria-pressed={attendanceFilter === filter}
                      className={`cursor-pointer rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${bgClass} ${attendanceFilter === filter ? 'border-[#b08a3e] ring-2 ring-[#b08a3e]/20' : 'border-[#dce6e8]'}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                      <p className={`mt-3 text-2xl font-bold ${color}`}>{value}</p>
                    </button>
                  ))}
                  <StatCard label="Attendance %" value={`${summary.attendancePercentage}%`} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card hoverEffect className="overflow-hidden">
            <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70 pb-3">
              <CardTitle className="text-base">Attendance Details</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {isAttendanceLoading ? (
                <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div>
              ) : attendanceError ? (
                <ErrorState message={attendanceError} />
              ) : filteredRecords.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  <EmptyState title="No attendance records" description="No records match the selected month and filter." />
                  {attendanceFilter !== 'ALL' && (
                    <button type="button" onClick={() => setAttendanceFilter('ALL')} className="mt-2 font-semibold text-[#1e627d] hover:text-[#073b5c]">
                      Reset Filter / View All
                    </button>
                  )}
                </div>
              ) : (
                <DataTable columns={attendanceColumns} data={filteredRecords} getRowKey={(record) => record.id} />
              )}
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={attendancePage <= 1 || isAttendanceLoading}
                  onClick={() => setAttendancePage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  Previous
                </Button>
                <span>Page {attendancePage} of {Math.max(attendanceTotalPages, 1)}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={attendancePage >= attendanceTotalPages || isAttendanceLoading || attendanceTotalPages === 0}
                  onClick={() => setAttendancePage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card hoverEffect className="overflow-hidden">
            <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70 pb-3">
              <CardTitle className="text-base">Leave Details</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {isLeaveLoading ? (
                <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div>
              ) : leaveError ? (
                <ErrorState message={leaveError} />
              ) : leaveRecords.length === 0 ? (
                <EmptyState title="No leave requests" description="Leave details will appear here when records are available." />
              ) : (
                <DataTable columns={leaveColumns} data={leaveRecords} getRowKey={(leave) => leave.id} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
