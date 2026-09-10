import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApiService, {
  type CreateEmployeeDto,
  type Employee360Attendance,
  type Employee360Document,
  type Employee360Hierarchy,
  type Employee360Leave,
  type Employee360Payroll,
  type EmployeeSalary,
  type Asset,
} from '../../services/api';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import { AssignSalaryModal } from '../../components/payroll/AssignSalaryModal';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge
} from '../../components/ui/components';
import {
  Edit, Briefcase, TrendingUp, Download, Eye
} from 'lucide-react';
import type { Role } from '../../types';

interface EmployeeProfileData {
  id?: string | number;
  employeeId?: string | number;
  userId?: string | number;
  name?: string;
  avatar?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  empCode?: string;
  department?: string;
  designation?: string;
  jobTitle?: string;
  role?: Role;
  status?: string;
  employmentType?: string;
  sourceOfHire?: string;
  dateOfJoining?: string | Date | null;
  currentExperience?: string | number;
  reportingManager?: string | number | null;
  dateOfBirth?: string | Date | null;
  age?: string | number;
  gender?: string;
  currentAddress?: string;
  permanentAddress?: string;
  pincode?: string | number;
  city?: string;
  maritalStatus?: string;
  phone?: string;
  personalMobile?: string;
  panNumber?: string;
  aadharNumber?: string;
  pfNumber?: string;
  uanNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  dateOfExit?: string | Date | null;
  isExperienced?: boolean;
  user?: {
    id?: string | number;
    email?: string;
    role?: Role;
    status?: string;
    isActive?: boolean;
  };
  team?: {
    id?: string | number;
    name?: string;
  } | null;
  isActive?: boolean;
}

const INACTIVE_STATUS = new Set(['INACTIVE', 'TERMINATED']);

const isEmployeeActive = (emp: EmployeeProfileData): boolean => {
  const status = String(emp?.status || emp?.user?.status || '').toUpperCase();
  if (status === 'ACTIVE') return true;
  if (INACTIVE_STATUS.has(status)) return false;
  if (typeof emp?.user?.isActive === 'boolean') return emp.user.isActive;
  if (typeof emp?.isActive === 'boolean') return emp.isActive;
  return true;
};

const getEmployeeStatusLabel = (emp: EmployeeProfileData): string => {
  const status = String(emp?.status || emp?.user?.status || '').toUpperCase();
  if (status === 'ACTIVE') return 'Active';
  if (status === 'INACTIVE') return 'Inactive';
  if (status === 'ON_LEAVE') return 'On Leave';
  if (status === 'TERMINATED') return 'Terminated';
  return isEmployeeActive(emp) ? 'Active' : 'Inactive';
};

const buildProfileInitialData = (employee: EmployeeProfileData) => ({
  email: employee.user?.email ?? employee.email,
  firstName: employee.firstName ?? '',
  lastName: employee.lastName ?? '',
  empCode: employee.empCode ?? '',
  department: employee.department ?? '',
  designation: employee.designation ?? '',
  role: employee.user?.role ?? employee.role ?? 'EMPLOYEE',
  employmentType: employee.employmentType,
  status: employee.status,
  sourceOfHire: employee.sourceOfHire,
  dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '',
  currentExperience: employee.currentExperience,
  reportingManager: employee.reportingManager,
  dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
  age: employee.age,
  gender: employee.gender,
  currentAddress: employee.currentAddress,
  permanentAddress: employee.permanentAddress,
  pincode: employee.pincode,
  city: employee.city,
  maritalStatus: employee.maritalStatus,
  phone: employee.phone,
  personalMobile: employee.personalMobile,
  panNumber: employee.panNumber,
  aadharNumber: employee.aadharNumber,
  pfNumber: employee.pfNumber,
  uanNumber: employee.uanNumber,
  bankAccountNumber: employee.bankAccountNumber,
  bankName: employee.bankName,
  ifscCode: employee.ifscCode,
  dateOfExit: employee.dateOfExit ? new Date(employee.dateOfExit).toISOString().split('T')[0] : '',
  isExperienced: employee.isExperienced,
});

const EmployeeProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
    const [editEmployee, setEditEmployee] = useState<EmployeeProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRaiseOpen, setIsRaiseOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<'personal' | 'employment' | 'contact' | 'attendance' | 'leave' | 'hierarchy' | 'assets' | 'documents' | 'payroll'>('personal');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [attendance, setAttendance] = useState<Employee360Attendance | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);
    const [leave, setLeave] = useState<Employee360Leave | null>(null);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveError, setLeaveError] = useState<string | null>(null);
    const [hierarchy, setHierarchy] = useState<Employee360Hierarchy | null>(null);
    const [hierarchyLoading, setHierarchyLoading] = useState(false);
    const [hierarchyError, setHierarchyError] = useState<string | null>(null);
    const [assets, setAssets] = useState<Asset[] | null>(null);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Employee360Document[] | null>(null);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [documentsError, setDocumentsError] = useState<string | null>(null);
    const [payroll, setPayroll] = useState<Employee360Payroll[] | null>(null);
    const [assignedSalary, setAssignedSalary] = useState<EmployeeSalary | null>(null);
    const [payrollLoading, setPayrollLoading] = useState(false);
    const [payrollError, setPayrollError] = useState<string | null>(null);

    // Check if user can edit employees
    const canEditEmployees = ['SUPER_ADMIN', 'CEO', 'HR'].includes(user?.role ?? '');
    const canManagePayroll = ['SUPER_ADMIN', 'CEO', 'HR', 'FINANCE_MANAGER'].includes(user?.role ?? '');

    useEffect(() => {
        let mounted = true;
        const empId = id;
        setLoading(true);
        setError(null);

        console.log('Loading employee profile:', empId, 'Current user:', user?.id, user?.employeeId, user?.role);

        ApiService.getEmployee360(Number(empId))
            .then((data) => {
                if (mounted === false) return;
                console.log('Employee data loaded:', data);
                setEmployee(data as EmployeeProfileData);
            })
            .catch((err) => {
                if (mounted === false) return;
                console.error('Error loading employee profile:', err);
                setError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => {
                if (mounted === false) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [id, user]);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'attendance') return;

      let mounted = true;
      setAttendanceLoading(true);
      setAttendanceError(null);
      ApiService.getEmployee360Attendance(Number(employee.id), selectedMonth)
        .then((data) => {
          if (mounted) setAttendance(data);
        })
        .catch((err) => {
          if (!mounted) return;
          setAttendance(null);
          setAttendanceError(err instanceof Error ? err.message : 'Failed to load attendance');
        })
        .finally(() => {
          if (mounted) setAttendanceLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [activeSection, employee?.id, selectedMonth]);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'leave') return;

      let mounted = true;
      setLeaveLoading(true);
      setLeaveError(null);
      ApiService.getEmployee360Leave(Number(employee.id))
        .then((data) => {
          if (mounted) setLeave(data);
        })
        .catch((err) => {
          if (!mounted) return;
          setLeave(null);
          setLeaveError(err instanceof Error ? err.message : 'Failed to load leave');
        })
        .finally(() => {
          if (mounted) setLeaveLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [activeSection, employee?.id]);

    const fetchSalaryData = useCallback(async (employeeId: number) => {
      setPayrollLoading(true);
      setPayrollError(null);
      setAssignedSalary(null);
      try {
        const [payrollRecords, salaryRecords] = await Promise.all([
        ApiService.getEmployee360Payroll(employeeId).catch((err) => {
          setPayrollError(err instanceof Error ? err.message : 'Failed to load payroll');
          return [] as Employee360Payroll[];
        }),
        ApiService.getEmployeeSalaries(employeeId),
        ]);
        setPayroll(payrollRecords);
        setAssignedSalary(salaryRecords.length > 0 ? salaryRecords[0] : null);
      } catch (err) {
        setPayroll([]);
        setAssignedSalary(null);
        setPayrollError(err instanceof Error ? err.message : 'Failed to load salary details');
      } finally {
        setPayrollLoading(false);
      }
    }, []);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'payroll') return;
      void fetchSalaryData(Number(employee.id));
    }, [activeSection, employee?.id, fetchSalaryData]);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'payroll') return;
      const handleSalaryAssigned = () => {
        void fetchSalaryData(Number(employee.id));
      };
      window.addEventListener('salary-assigned', handleSalaryAssigned);
      return () => {
        window.removeEventListener('salary-assigned', handleSalaryAssigned);
      };
    }, [activeSection, employee?.id, fetchSalaryData]);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'hierarchy') return;

      let mounted = true;
      setHierarchyLoading(true);
      setHierarchyError(null);
      ApiService.getEmployee360Hierarchy(Number(employee.id))
        .then((data) => {
          if (mounted) setHierarchy(data);
        })
        .catch((err) => {
          if (!mounted) return;
          setHierarchy(null);
          setHierarchyError(err instanceof Error ? err.message : 'Failed to load hierarchy');
        })
        .finally(() => {
          if (mounted) setHierarchyLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [activeSection, employee?.id]);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'assets') return;

      let mounted = true;
      setAssetsLoading(true);
      setAssetsError(null);
      ApiService.getEmployee360Assets(Number(employee.id))
        .then((data) => {
          if (mounted) setAssets(data || []);
        })
        .catch((err) => {
          if (!mounted) return;
          setAssets(null);
          setAssetsError(err instanceof Error ? err.message : 'Failed to load assets');
        })
        .finally(() => {
          if (mounted) setAssetsLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [activeSection, employee?.id]);

    useEffect(() => {
      if (!employee?.id || activeSection !== 'documents') return;

      let mounted = true;
      setDocumentsLoading(true);
      setDocumentsError(null);
      ApiService.getEmployee360Documents(Number(employee.id))
        .then((data) => {
          if (mounted) setDocuments(data || []);
        })
        .catch((err) => {
          if (!mounted) return;
          setDocuments(null);
          setDocumentsError(err instanceof Error ? err.message : 'Failed to load documents');
        })
        .finally(() => {
          if (mounted) setDocumentsLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [activeSection, employee?.id]);

    const handleEmployeeUpdated = async () => {
      if (!employee?.id) return;

      const refreshedEmployee = await ApiService.getEmployeeById(Number(employee.id));
      setEmployee(refreshedEmployee as EmployeeProfileData);
      setEditEmployee(refreshedEmployee as EmployeeProfileData);
        setIsEditOpen(false);
    };

    const salary = assignedSalary;
    const hasSalary = Boolean(
      salary && ((salary as any)?.annualCTC || (salary as any)?.annualCtc || (salary as any)?.ctc),
    );
    const hasPayrollHistory = Boolean(payroll && payroll.length > 0);

    const profileInitialData = editEmployee ? buildProfileInitialData(editEmployee) : undefined;

    const handleEditEmployee = async () => {
      if (!employee?.id) return;

      try {
        const detailedEmployee = await ApiService.getEmployeeById(Number(employee.id));
        setEditEmployee(detailedEmployee as EmployeeProfileData);
        setIsEditOpen(true);
      } catch (editError) {
        console.error('Error loading employee details for edit:', editError);
      }
    };

    const handleDocumentFile = async (documentId: number, fileName: string | null | undefined, download: boolean) => {
      try {
        const { blob, fileName: responseFileName } = await ApiService.downloadDocumentFile(documentId);
        const url = URL.createObjectURL(blob);
        if (download) {
          const link = document.createElement('a');
          link.href = url;
          link.download = responseFileName || fileName || `document-${documentId}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          return;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (documentError) {
        setDocumentsError(documentError instanceof Error ? documentError.message : 'Failed to fetch document');
      }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-500">Loading employee details...</div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
                 <h2 className="text-xl font-semibold text-slate-800">Unable to Load Employee Profile</h2>
                 <p className="text-slate-500 mb-2">{error ? `Error: ${error}` : 'The employee you are looking for does not exist or has been removed.'}</p>
                 <p className="text-xs text-slate-400 mb-4">Route ID: {id} | User Role: {user?.role} | User employeeId: {user?.employeeId}</p>
            </div>
        );
    }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-6">
                <img 
                  src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((employee.firstName ?? '') + ' ' + (employee.lastName ?? ''))}&background=random`}
                  alt={employee.firstName || 'Employee'} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm" 
                />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{employee.firstName ? `${employee.firstName} ${employee.lastName || ''}`.trim() : 'Employee'}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-slate-500 mt-2 text-sm">
                        <span className="flex items-center gap-1"><Briefcase size={14} /> {employee.designation || employee.jobTitle || '-'}</span>
                        <span className="hidden sm:inline mx-1">•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{employee.department || '-'}</span>
                    </div>
                </div>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
                 {canManagePayroll && (
                   <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsRaiseOpen(true)}>
                      <TrendingUp size={16} className="mr-2" /> Give Raise
                   </Button>
                 )}
                 {canEditEmployees && (
                   <Button className="flex-1 md:flex-none" onClick={handleEditEmployee}>
                      <Edit size={16} className="mr-2" /> Edit
                   </Button>
                 )}
             </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Employee 360 sections">
          {[
            ['personal', 'Personal'],
            ['employment', 'Employment'],
            ['contact', 'Contact'],
            ['attendance', 'Attendance'],
            ['leave', 'Leave'],
            ['hierarchy', 'Hierarchy'],
            ['assets', 'Assets'],
            ['documents', 'Documents'],
            ['payroll', 'Payroll'],
          ].map(([section, label]) => (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={activeSection === section}
              onClick={() => setActiveSection(section as 'personal' | 'employment' | 'contact' | 'attendance' | 'leave' | 'hierarchy' | 'assets' | 'documents' | 'payroll')}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === section
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeSection === 'personal' ? 'Personal Information' : activeSection === 'employment' ? 'Employment Information' : activeSection === 'contact' ? 'Contact Information' : activeSection === 'attendance' ? 'Attendance' : activeSection === 'leave' ? 'Leave' : activeSection === 'hierarchy' ? 'Team / Reporting Hierarchy' : activeSection === 'assets' ? 'Assets' : activeSection === 'documents' ? 'Documents' : 'Payroll'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {activeSection === 'personal' && (
            <>
              <div><p className="text-xs text-slate-500 font-medium">First Name</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.firstName || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Last Name</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.lastName || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Email Address</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.user?.email || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Phone</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.phone || '-'}</p></div>
            </>
          )}
          {activeSection === 'employment' && (
            <>
              <div><p className="text-xs text-slate-500 font-medium">Employee Code</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.empCode || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Department</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.department || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Designation</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.designation || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Team</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.team?.name || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Role</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.user?.role || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Employment Type</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.employmentType || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Status</p><Badge variant={isEmployeeActive(employee) ? 'success' : 'danger'} className="mt-1">{getEmployeeStatusLabel(employee)}</Badge></div>
              <div><p className="text-xs text-slate-500 font-medium">Date of Joining</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '-'}</p></div>
            </>
          )}
          {activeSection === 'contact' && (
            <>
              <div><p className="text-xs text-slate-500 font-medium">City</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.city || '-'}</p></div>
              <div><p className="text-xs text-slate-500 font-medium">Phone</p><p className="text-sm font-medium text-slate-900 mt-1">{employee.phone || '-'}</p></div>
            </>
          )}
          {activeSection === 'attendance' && (
            <div className="sm:col-span-2 space-y-5">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span>Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  aria-label="Select attendance month"
                />
              </label>
              {attendanceLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading attendance...</p>
              ) : attendanceError ? (
                <p className="py-8 text-center text-sm text-slate-500">Unable to load attendance: {attendanceError}</p>
              ) : !attendance ? (
                <p className="py-8 text-center text-sm text-slate-500">No attendance summary available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    ['Month', attendance.month],
                    ['Working Days', attendance.workingDays],
                    ['Present Days', attendance.presentDays],
                    ['Half Days', attendance.halfDays],
                    ['Leave Days', attendance.leaveDays],
                    ['Absent Days', attendance.absentDays],
                    ['Present Equivalent Days', attendance.presentEquivalentDays],
                    ['Attendance Percentage', `${attendance.attendancePercentage}%`],
                  ].map(([label, value]) => (
                    <div key={label as string}><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-sm font-medium text-slate-900 mt-1">{value}</p></div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeSection === 'leave' && (
            <div className="sm:col-span-2 space-y-5">
              {leaveLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading leave information...</p>
              ) : leaveError ? (
                <p className="py-8 text-center text-sm text-slate-500">Unable to load leave information: {leaveError}</p>
              ) : !leave ? (
                <p className="py-8 text-center text-sm text-slate-500">No leave information available.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><p className="text-xs text-slate-500 font-medium">Current Status</p><p className="text-sm font-medium text-slate-900 mt-1">{leave.currentLeaveStatus.status}</p></div>
                    <div><p className="text-xs text-slate-500 font-medium">Total Requests</p><p className="text-sm font-medium text-slate-900 mt-1">{leave.leaveCounts.total}</p></div>
                    <div><p className="text-xs text-slate-500 font-medium">Pending</p><p className="text-sm font-medium text-slate-900 mt-1">{leave.leaveCounts.pending}</p></div>
                    <div><p className="text-xs text-slate-500 font-medium">Approved</p><p className="text-sm font-medium text-slate-900 mt-1">{leave.leaveCounts.approved}</p></div>
                    <div><p className="text-xs text-slate-500 font-medium">Rejected</p><p className="text-sm font-medium text-slate-900 mt-1">{leave.leaveCounts.rejected}</p></div>
                  </div>
                  {leave.balanceSummary.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 pr-4">Leave Type</th><th className="py-2 pr-4">Allocated</th><th className="py-2 pr-4">Used</th><th className="py-2 pr-4">Remaining</th></tr></thead>
                        <tbody>{leave.balanceSummary.map((balance) => <tr key={balance.leaveType} className="border-b border-slate-100"><td className="py-2 pr-4">{balance.leaveType}</td><td className="py-2 pr-4">{balance.allocated}</td><td className="py-2 pr-4">{balance.used}</td><td className="py-2 pr-4">{balance.remaining}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                  {leave.recentHistory.length > 0 && (
                    <div className="space-y-2"><h3 className="text-sm font-semibold text-slate-800">Recent Leave</h3>{leave.recentHistory.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-sm"><span>{item.leaveType}</span><span className="text-slate-500">{item.status} · {item.totalDays} days</span></div>)}</div>
                  )}
                </>
              )}
            </div>
          )}
          {activeSection === 'hierarchy' && (
            <div className="sm:col-span-2">
              {hierarchyLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading hierarchy...</p>
              ) : hierarchyError ? (
                <p className="py-8 text-center text-sm text-slate-500">Unable to load hierarchy: {hierarchyError}</p>
              ) : !hierarchy || (!hierarchy.team && !hierarchy.manager && !hierarchy.reportingRelationship) ? (
                <p className="py-8 text-center text-sm text-slate-500">No hierarchy information available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><p className="text-xs text-slate-500 font-medium">Team</p><p className="text-sm font-medium text-slate-900 mt-1">{hierarchy.team?.name || '-'}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Manager</p><p className="text-sm font-medium text-slate-900 mt-1">{hierarchy.manager?.name || '-'}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Manager Designation</p><p className="text-sm font-medium text-slate-900 mt-1">{hierarchy.manager?.designation || '-'}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Reporting Relationship</p><p className="text-sm font-medium text-slate-900 mt-1">{hierarchy.reportingRelationship?.type || '-'}</p></div>
                </div>
              )}
            </div>
          )}
          {activeSection === 'assets' && (
            <div className="sm:col-span-2">
              {assetsLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading assets...</p>
              ) : assetsError ? (
                <p className="py-8 text-center text-sm text-slate-500">Unable to load assets: {assetsError}</p>
              ) : !assets || assets.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No assets assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border-b border-slate-100 pb-3 last:border-b-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="text-xs font-medium text-slate-500">Asset ID</span><p className="font-medium text-slate-900">{asset.id}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Name</span><p className="font-medium text-slate-900">{asset.name}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Description</span><p className="text-slate-700">{asset.description || '-'}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Assigned Date</span><p className="text-slate-700">{asset.assignedAt ? new Date(asset.assignedAt).toLocaleDateString() : '-'}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Status</span><p className="text-slate-700">{asset.status}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeSection === 'documents' && (
            <div className="sm:col-span-2">
              {documentsLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading documents...</p>
              ) : documentsError ? (
                <p className="py-8 text-center text-sm text-slate-500">Unable to load documents: {documentsError}</p>
              ) : !documents || documents.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No documents available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs text-slate-500">
                      <tr><th className="py-2 pr-4">Document</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Uploaded</th><th className="py-2">Actions</th></tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr key={document.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{document.fileName || '-'}</td>
                          <td className="py-3 pr-4 text-slate-700">{document.documentType?.name || document.mimeType || '-'}</td>
                          <td className="py-3 pr-4"><Badge variant={document.status === 'APPROVED' ? 'success' : document.status === 'REJECTED' ? 'danger' : 'warning'}>{document.status || 'PENDING'}</Badge></td>
                          <td className="py-3 pr-4 text-slate-700">{document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : '-'}</td>
                          <td className="py-3"><div className="flex flex-wrap gap-2"><Button size="xs" variant="outline" onClick={() => handleDocumentFile(document.id, document.fileName, false)}><Eye size={14} className="mr-1" />Preview</Button><Button size="xs" variant="outline" onClick={() => handleDocumentFile(document.id, document.fileName, true)}><Download size={14} className="mr-1" />Download</Button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeSection === 'payroll' && (
            <div className="sm:col-span-2">
              {payrollLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading payroll...</p>
              ) : payrollError && !hasSalary && !hasPayrollHistory ? (
                <p className="py-8 text-center text-sm text-slate-500">Unable to load payroll: {payrollError}</p>
              ) : (
                <div className="space-y-5">
                  {hasSalary && salary && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Assigned Salary</p>
                      <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div><span className="text-xs font-medium text-slate-500">Annual CTC</span><p className="font-semibold text-slate-900">{Number((assignedSalary as any)?.annualCTC ?? (assignedSalary as any)?.annualCtc ?? (assignedSalary as any)?.ctc ?? 0).toLocaleString()}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Monthly CTC</span><p className="font-semibold text-slate-900">{Number((assignedSalary as any)?.monthlyCTC ?? (assignedSalary as any)?.monthlyCtc ?? (assignedSalary as any)?.monthlySalary ?? 0).toLocaleString()}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Salary Structure</span><p className="text-slate-700">{assignedSalary.structure?.name || `Structure #${assignedSalary.structureId}`}</p></div>
                        <div><span className="text-xs font-medium text-slate-500">Effective From</span><p className="text-slate-700">{assignedSalary.effectiveFrom ? new Date(assignedSalary.effectiveFrom).toLocaleDateString() : '-'}</p></div>
                      </div>
                    </div>
                  )}
                  {payroll && payroll.length > 0 ? payroll.map((record) => (
                    <div key={`${record.year}-${record.month}`} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-slate-100 pb-3 text-sm last:border-b-0">
                      <div><span className="text-xs font-medium text-slate-500">Month</span><p className="font-medium text-slate-900">{record.month}</p></div>
                      <div><span className="text-xs font-medium text-slate-500">Year</span><p className="font-medium text-slate-900">{record.year}</p></div>
                      <div><span className="text-xs font-medium text-slate-500">Status</span><p className="text-slate-700">{record.status}</p></div>
                      <div><span className="text-xs font-medium text-slate-500">Gross</span><p className="text-slate-700">{record.grossSalary}</p></div>
                      <div><span className="text-xs font-medium text-slate-500">Deductions</span><p className="text-slate-700">{record.deductions}</p></div>
                      <div><span className="text-xs font-medium text-slate-500">Net</span><p className="text-slate-700">{record.netSalary}</p></div>
                      {record.latestSalaryEffectiveDate && (
                        <div><span className="text-xs font-medium text-slate-500">Salary Effective Date</span><p className="text-slate-700">{new Date(record.latestSalaryEffectiveDate).toLocaleDateString()}</p></div>
                      )}
                    </div>
                  )) : !hasSalary && !hasPayrollHistory ? (
                    <p className="py-8 text-center text-sm text-slate-500">No salary assignment or payroll records available.</p>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEmployeeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEmployeeUpdated}
        mode="edit"
        employeeId={employee?.id !== undefined && employee?.id !== null ? Number(employee.id) : undefined}
        initialData={profileInitialData as Partial<CreateEmployeeDto>}
      />

      <AssignSalaryModal
        isOpen={isRaiseOpen}
        onClose={() => setIsRaiseOpen(false)}
        presetEmpCode={employee.empCode}
        presetEmployeeName={`${employee.firstName || ''} ${employee.lastName || ''}`.trim()}
      />

    </div>
  );
};

export default EmployeeProfile;