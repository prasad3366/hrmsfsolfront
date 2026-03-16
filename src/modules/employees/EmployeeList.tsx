import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import { 
  Table, TableHeader, TableRow, TableHead, TableCell, 
  Button, Input, Badge, Card, CardHeader, CardTitle, CardContent 
} from '../../components/ui/components';
import { Search, Plus, Filter, Download, MoreHorizontal } from 'lucide-react';

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    ApiService.getAllEmployees()
      .then((data) => {
        if (!mounted) return;
        setEmployees(data || []);
      })
      .catch((err) => {
        console.error('Failed to load employees', err);
      })
      .finally(() => setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    // Map API employee shape to display-friendly fields
    const mapped = employees.map((emp) => ({
      id: emp.user?.id ?? emp.id,
      name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.empCode || 'Unknown',
      email: emp.user?.email ?? emp.email ?? '',
      designation: emp.designation ?? '',
      role: emp.role ?? emp.user?.role ?? 'EMPLOYEE',
      department: emp.department ?? '',
      status: emp.user?.isActive ? 'Active' : 'Inactive',
      joinDate: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '-',
      avatar: emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((emp.firstName ?? '') + ' ' + (emp.lastName ?? ''))}`,
    }));

    return mapped.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500">Manage your workforce</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download size={16} /> Export
          </Button>
          <Button className="gap-2">
            <Plus size={16} /> Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input 
                placeholder="Search by name, email..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter size={16} /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 text-center text-sm text-slate-500">Loading employees...</div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredEmployees.map((emp) => (
                <TableRow 
                    key={emp.id} 
                    className="cursor-pointer" 
                    onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="font-medium text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{emp.role.toLowerCase()}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-slate-100 text-slate-600 border-none font-normal">
                      {emp.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={emp.status === 'Active' ? 'success' : 'danger'}
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{emp.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeList;