import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApiService, { EmployeeDirectoryQuery, EmployeeDirectoryResponse } from '../../services/api';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import {
  Button, Card, CardContent, CardHeader, DataTable, EmptyState, ErrorState,
  PageHeader, SearchBox, Select, Skeleton, StatCard, StatusBadge, type DataTableColumn,
} from '../../components/ui/components';
import { ArrowDown, ArrowUp, BriefcaseBusiness, Download, Filter, Plus, Settings, Users } from 'lucide-react';

type ColumnKey = 'employee' | 'empCode' | 'role' | 'designation' | 'department' | 'status' | 'joinDate';
type SortKey = NonNullable<EmployeeDirectoryQuery['sortBy']>;
const columns: { key: ColumnKey; label: string }[] = [
  { key: 'employee', label: 'Employee' }, { key: 'empCode', label: 'Employee Code' }, { key: 'role', label: 'Role' },
  { key: 'designation', label: 'Designation' }, { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' }, { key: 'joinDate', label: 'Join Date' },
];

export const mapEmployee = (employee: any) => {
  const status = String(employee.status ?? '').toUpperCase();
  return {
    id: employee.id,
    empCode: employee.empCode ?? '-', name: `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || employee.empCode || 'Unknown',
    role: employee.role ?? employee.user?.role ?? 'EMPLOYEE',
    designation: employee.designation ?? '-', department: employee.department ?? '-',
    status: status === 'ON_LEAVE' ? 'On Leave' : status === 'INACTIVE' ? 'Inactive' : 'Active',
    joinDate: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '-',
    avatar: employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee.firstName ?? ''} ${employee.lastName ?? ''}`)}`,
  };
};

type DirectoryEmployee = ReturnType<typeof mapEmployee>;

const DirectorySkeleton = () => <div className="space-y-3 p-5" aria-label="Loading employees" role="status">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-4 border-b border-[#edf3f5] pb-3 last:border-0"><Skeleton className="h-10 w-10 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-24" /></div><Skeleton className="hidden h-3 w-24 sm:block" /><Skeleton className="hidden h-3 w-20 md:block" /></div>)}</div>;

const EmployeeList = () => {
  const navigate = useNavigate(); const { user } = useAuth();
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]); const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All'); const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('empCode'); const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); const [page, setPage] = useState(1);
  const [statistics, setStatistics] = useState<EmployeeDirectoryResponse['statistics']>({ total: 0, active: 0, newJoiners: 0, onLeave: 0, probation: 0, noticePeriod: 0 });
  const [meta, setMeta] = useState<EmployeeDirectoryResponse['meta']>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false); const [isSettingsOpen, setIsSettingsOpen] = useState(false); const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => { try { return JSON.parse(localStorage.getItem('employee-directory-columns') || 'null') || columns.map((column) => column.key); } catch { return columns.map((column) => column.key); } });
  const canManageEmployees = ['SUPER_ADMIN', 'CEO', 'HR'].includes(user?.role ?? '');
  const departments = useMemo(() => Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean))).sort(), [employees]);
  const query = useMemo<EmployeeDirectoryQuery>(() => ({ search: searchTerm || undefined, department: departmentFilter === 'All' ? undefined : departmentFilter, status: statusFilter === 'All' ? undefined : statusFilter === 'On Leave' ? 'ON_LEAVE' : statusFilter.toUpperCase() as 'ACTIVE' | 'INACTIVE', sortBy, sortDirection, page, pageSize: 25 }), [searchTerm, departmentFilter, statusFilter, sortBy, sortDirection, page]);

  const fetchEmployees = async (request: EmployeeDirectoryQuery = query) => {
    setIsLoading(true); setError(null);
    try { const result = await ApiService.getAllEmployees(request) as EmployeeDirectoryResponse; setEmployees((result.data || []).map(mapEmployee)); setMeta(result.meta); setStatistics(result.statistics); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load employees'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { void fetchEmployees(); }, [query]);
  useEffect(() => { localStorage.setItem('employee-directory-columns', JSON.stringify(visibleColumns)); }, [visibleColumns]);
  const setFilter = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => { setter(value); setPage(1); };
  const toggleSort = (key: SortKey) => { setPage(1); if (sortBy === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDirection('asc'); } };
  const resetFilters = () => { setSearchTerm(''); setDepartmentFilter('All'); setStatusFilter('All'); setPage(1); };
  const show = (key: ColumnKey) => visibleColumns.includes(key);
  const sortFor = (key: ColumnKey): SortKey | null => key === 'employee' ? 'name' : key === 'joinDate' ? 'dateOfJoining' : ['empCode', 'department', 'status'].includes(key) ? key as SortKey : null;
  const sortHeader = (key: ColumnKey, label: string) => { const sortable = sortFor(key); if (!sortable) return label; return <button type="button" className="inline-flex items-center gap-1 font-bold transition-colors hover:text-[#073b5c]" onClick={() => toggleSort(sortable)}>{label}{sortBy === sortable && (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button>; };
  const handleExport = async () => {
    const result = await ApiService.getAllEmployees({ ...query, page: 1, pageSize: 10000 }) as EmployeeDirectoryResponse; const rows = (result.data || []).map(mapEmployee); if (!rows.length) return;
    const headers = ['Employee ID', 'Name', 'Employee Code', 'Department', 'Designation', 'Status', 'Date of Joining']; const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows.map((employee) => [employee.id, employee.name, employee.empCode, employee.department, employee.designation, employee.status, employee.joinDate])].map((row) => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = 'employees.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const statItems = [
    { label: 'Total employees', value: statistics.total, icon: <Users size={18} /> },
    { label: 'Active', value: statistics.active, icon: <BriefcaseBusiness size={18} /> },
    { label: 'New joiners', value: statistics.newJoiners, icon: <Plus size={18} /> },
    { label: 'On leave', value: statistics.onLeave, icon: <Filter size={18} /> },
  ]; 
  const tableColumns: DataTableColumn<DirectoryEmployee>[] = columns.filter((column) => show(column.key)).map((column) => ({
    key: column.key,
    header: sortHeader(column.key, column.label),
    className: column.key === 'empCode' ? 'whitespace-nowrap' : undefined,
    render: (employee) => {
      if (column.key === 'employee') return <div className="flex min-w-48 items-center gap-3"><img src={employee.avatar} alt="" className="h-10 w-10 rounded-full border border-[#dce6e8] object-cover" /><div className="min-w-0"><div className="truncate font-bold text-[#12354a]">{employee.name}</div><div className="truncate text-xs text-[#78909a]">{employee.designation}</div></div></div>;
      if (column.key === 'empCode') return <span className="font-bold tracking-wide text-[#0d526b]">{employee.empCode}</span>;
      if (column.key === 'role') return <span className="capitalize text-[#617984]">{employee.role.toLowerCase().replaceAll('_', ' ')}</span>;
      if (column.key === 'department') return <span className="rounded-full bg-[#edf3f5] px-2.5 py-1 text-xs font-semibold text-[#486271]">{employee.department}</span>;
      if (column.key === 'status') return <StatusBadge status={employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'danger'}>{employee.status}</StatusBadge>;
      return <span className="text-[#617984]">{employee[column.key as 'designation' | 'joinDate']}</span>;
    },
  }));

  return <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader title="Employees" description={canManageEmployees ? 'Manage your workforce from one secure directory.' : 'Browse the organization-wide employee directory.'} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2" type="button" onClick={handleExport}><Download size={16} /> Export</Button>{canManageEmployees && <Button variant="gold" type="button" className="gap-2" onClick={() => setIsCreateEmployeeOpen(true)}><Plus size={16} /> Add employee</Button>}</div>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{statItems.map((item) => <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />)}</div>
    <Card>
      <CardHeader className="border-b border-[#e4ecec] pb-4"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="w-full max-w-xl"><SearchBox placeholder="Search by name or employee code..." value={searchTerm} onChange={(event) => setFilter(setSearchTerm, event.target.value)} /></div><div className="flex flex-wrap gap-2"><Button variant={isFilterOpen ? 'secondary' : 'outline'} className="gap-2" type="button" onClick={() => setIsFilterOpen((open) => !open)}><Filter size={16} /> Filter</Button><Button variant="outline" type="button" aria-label="Column settings" title="Column settings" onClick={() => setIsSettingsOpen((open) => !open)}><Settings size={16} /></Button></div></div>
        {isFilterOpen && <div className="grid gap-3 border-t border-[#edf3f5] pt-4 sm:grid-cols-3"><label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wide text-[#617984]">Department / team<Select value={departmentFilter} onChange={(event) => setFilter(setDepartmentFilter, event.target.value)}><option>All</option>{departments.map((department) => <option key={department}>{department}</option>)}</Select></label><label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wide text-[#617984]">Status<Select value={statusFilter} onChange={(event) => setFilter(setStatusFilter, event.target.value)}><option>All</option><option>Active</option><option>Inactive</option><option>On Leave</option></Select></label><Button variant="ghost" type="button" className="self-end sm:mb-0" onClick={resetFilters}>Clear filters</Button></div>}
        {isSettingsOpen && <div className="flex flex-wrap gap-4 border-t border-[#edf3f5] pt-4">{columns.map((column) => <label key={column.key} className="flex items-center gap-2 text-sm text-[#486271]"><input type="checkbox" className="accent-[#b08a3e]" checked={show(column.key)} disabled={visibleColumns.length === 1 && show(column.key)} onChange={() => setVisibleColumns((current) => current.includes(column.key) ? current.filter((key) => key !== column.key) : [...current, column.key])} />{column.label}</label>)}</div>}
      </CardHeader>
      <CardContent className="p-0">{isLoading ? <DirectorySkeleton /> : error ? <ErrorState message={<>Unable to load employees: {error}</>} onRetry={() => void fetchEmployees()} /> : !employees.length ? <EmptyState title="No employees found" description="Try adjusting the current search or filters." action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>} /> : <DataTable columns={tableColumns} data={employees} getRowKey={(employee) => employee.id} onRowClick={(employee) => navigate(`/employees/${employee.id}`)} emptyState={<EmptyState title="No employees found" />} />}{!isLoading && !error && meta.totalPages > 0 && <div className="flex flex-col gap-2 border-t border-[#e4ecec] p-4 text-sm text-[#617984] sm:flex-row sm:items-center sm:justify-between"><span>Page {meta.page} of {meta.totalPages} ({meta.total} employees)</span><div className="flex gap-2"><Button variant="outline" type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" type="button" aria-label="Next page" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>}</CardContent>
    </Card>
    <CreateEmployeeModal isOpen={isCreateEmployeeOpen} onClose={() => setIsCreateEmployeeOpen(false)} onSuccess={() => { setIsCreateEmployeeOpen(false); void fetchEmployees(); }} />
  </div>;
};

export default EmployeeList;
