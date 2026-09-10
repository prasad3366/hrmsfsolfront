import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApiService, { EmployeeDirectoryQuery, EmployeeDirectoryResponse } from '../../services/api';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import { Table, TableHeader, TableRow, TableHead, TableCell, Button, Input, Badge, Card, CardHeader, CardContent } from '../../components/ui/components';
import { Search, Plus, Filter, Download, Settings, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

type ColumnKey = 'employee' | 'empCode' | 'role' | 'designation' | 'department' | 'status' | 'joinDate';
type SortKey = NonNullable<EmployeeDirectoryQuery['sortBy']>;
const columns: { key: ColumnKey; label: string }[] = [
  { key: 'employee', label: 'Employee' }, { key: 'empCode', label: 'Emp Code' }, { key: 'role', label: 'Role' },
  { key: 'designation', label: 'Designation' }, { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' }, { key: 'joinDate', label: 'Join Date' },
];

const mapEmployee = (employee: any) => {
  const status = String(employee.status ?? '').toUpperCase();
  return {
    ...employee,
    empCode: employee.empCode ?? '-', name: `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || employee.empCode || 'Unknown',
    email: employee.user?.email ?? employee.email ?? '', role: employee.role ?? employee.user?.role ?? 'EMPLOYEE',
    status: status === 'ON_LEAVE' ? 'On Leave' : status === 'INACTIVE' ? 'Inactive' : 'Active',
    joinDate: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '-',
    avatar: employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee.firstName ?? ''} ${employee.lastName ?? ''}`)}`,
  };
};

const EmployeeList = () => {
  const navigate = useNavigate(); const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]); const [searchTerm, setSearchTerm] = useState('');
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
  const handleExport = async () => {
    const result = await ApiService.getAllEmployees({ ...query, page: 1, pageSize: 10000 }) as EmployeeDirectoryResponse; const rows = (result.data || []).map(mapEmployee); if (!rows.length) return;
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Status', 'Date of Joining']; const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows.map((employee) => [employee.id, employee.name, employee.email, employee.phone, employee.department, employee.designation, employee.status, employee.joinDate])].map((row) => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = 'employees.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const statItems = [['Total', statistics.total], ['Active', statistics.active], ['New Joiners', statistics.newJoiners], ['On Leave', statistics.onLeave], ['Probation', statistics.probation], ['Notice Period', statistics.noticePeriod]];

  return <div className="p-6 md:p-8 max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"><div><h1 className="text-2xl font-bold text-slate-900">Employees</h1><p className="text-slate-500">{canManageEmployees ? 'Manage your workforce' : 'View team members'}</p></div><div className="flex gap-3"><Button variant="outline" className="gap-2" type="button" onClick={handleExport}><Download size={16} /> Export</Button>{canManageEmployees && <Button type="button" className="gap-2" onClick={() => setIsCreateEmployeeOpen(true)}><Plus size={16} /> Add Employee</Button>}</div></div>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">{statItems.map(([label, value]) => <Card key={label as string}><CardContent className="p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-semibold text-slate-900">{value}</div></CardContent></Card>)}</div>
    <Card><CardHeader className="border-b border-slate-100 pb-4"><div className="flex flex-col sm:flex-row gap-4 justify-between"><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><Input placeholder="Search by name, email..." className="pl-10" value={searchTerm} onChange={(event) => setFilter(setSearchTerm, event.target.value)} /></div><div className="flex gap-2"><Button variant="outline" className="gap-2" type="button" onClick={() => setIsFilterOpen((open) => !open)}><Filter size={16} /> Filter</Button><Button variant="outline" type="button" aria-label="Column settings" title="Column settings" onClick={() => setIsSettingsOpen((open) => !open)}><Settings size={16} /></Button></div></div>
      {isFilterOpen && <div className="flex flex-col sm:flex-row gap-3 pt-4"><label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Department/Team<select value={departmentFilter} onChange={(event) => setFilter(setDepartmentFilter, event.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal text-slate-900"><option>All</option>{departments.map((department) => <option key={department}>{department}</option>)}</select></label><label className="flex flex-col gap-1 text-xs font-medium text-slate-600">Status<select value={statusFilter} onChange={(event) => setFilter(setStatusFilter, event.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-normal text-slate-900"><option>All</option><option>Active</option><option>Inactive</option><option>On Leave</option></select></label><Button variant="outline" type="button" className="self-end" onClick={resetFilters}>Clear Filters</Button></div>}
      {isSettingsOpen && <div className="flex flex-wrap gap-4 pt-4">{columns.map((column) => <label key={column.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show(column.key)} disabled={visibleColumns.length === 1 && show(column.key)} onChange={() => setVisibleColumns((current) => current.includes(column.key) ? current.filter((key) => key !== column.key) : [...current, column.key])} />{column.label}</label>)}</div>}
    </CardHeader><CardContent className="p-0">{isLoading ? <div className="p-6 text-center text-sm text-slate-500">Loading employees...</div> : error ? <div className="p-6 text-center text-sm text-slate-500">Unable to load employees: {error}</div> : !employees.length ? <div className="p-6 text-center text-sm text-slate-500">No employees found.</div> : <Table><TableHeader><TableRow>{columns.filter((column) => show(column.key)).map((column) => { const sortable = sortFor(column.key); return <TableHead key={column.key}>{sortable ? <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(sortable)}>{column.label}{sortBy === sortable && (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button> : column.label}</TableHead>; })}</TableRow></TableHeader><tbody>{employees.map((employee) => <TableRow key={employee.id} className="cursor-pointer" onClick={() => navigate(`/employees/${employee.id}`)}>{show('employee') && <TableCell><div className="flex items-center gap-3"><img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" /><div><div className="font-medium text-slate-900">{employee.name}</div><div className="text-xs text-slate-500">{employee.email}</div></div></div></TableCell>}{show('empCode') && <TableCell>{employee.empCode}</TableCell>}{show('role') && <TableCell className="capitalize">{employee.role.toLowerCase()}</TableCell>}{show('designation') && <TableCell>{employee.designation}</TableCell>}{show('department') && <TableCell><Badge variant="default" className="bg-slate-100 text-slate-600 border-none font-normal">{employee.department}</Badge></TableCell>}{show('status') && <TableCell><Badge variant={employee.status === 'Active' ? 'success' : 'danger'}>{employee.status}</Badge></TableCell>}{show('joinDate') && <TableCell>{employee.joinDate}</TableCell>}</TableRow>)}</tbody></Table>}{!isLoading && !error && meta.totalPages > 0 && <div className="flex items-center justify-between p-4 border-t border-slate-100"><span className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages} ({meta.total} employees)</span><div className="flex gap-2"><Button variant="outline" type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={16} /></Button><Button variant="outline" type="button" aria-label="Next page" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}><ChevronRight size={16} /></Button></div></div>}</CardContent></Card>
    <CreateEmployeeModal isOpen={isCreateEmployeeOpen} onClose={() => setIsCreateEmployeeOpen(false)} onSuccess={() => { setIsCreateEmployeeOpen(false); void fetchEmployees(); }} />
  </div>;
};

export default EmployeeList;