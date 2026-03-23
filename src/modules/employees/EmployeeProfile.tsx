import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/api';
import { CreateEmployeeModal } from '../../components/employees/CreateEmployeeModal';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Badge
} from '../../components/ui/components';
import { 
  Edit, Briefcase
} from 'lucide-react';

const EmployeeProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [employee, setEmployee] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Check if user can edit employees
    const canEditEmployees = user?.role === 'ADMIN' || user?.role === 'HR';

    useEffect(() => {
        let mounted = true;
        const empId = id;
        setLoading(true);
        setError(null);

        console.log('Loading employee profile:', empId, 'Current user:', user?.id, user?.employeeId, user?.role);

        ApiService.getEmployeeById(empId as string)
            .then((data) => {
                if (!mounted) return;
                console.log('Employee data loaded:', data);
                setEmployee(data);
            })
            .catch((err) => {
                if (!mounted) return;
                console.error('Error loading employee profile:', err);
                setError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [id, user]);

    const handleEmployeeUpdated = (updated: any) => {
        setEmployee((prev) => ({ ...prev, ...updated }));
        setIsEditOpen(false);
    };

    const profileInitialData = employee
      ? {
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
        }
      : undefined;

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
                 {canEditEmployees && (
                   <Button className="flex-1 md:flex-none" onClick={() => setIsEditOpen(true)}>
                      <Edit size={16} className="mr-2" /> Edit
                   </Button>
                 )}
             </div>
        </div>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">First Name</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.firstName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Last Name</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.lastName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Email Address</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{(employee.user?.email ?? employee.email) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Phone</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Date of Birth</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Gender</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.gender || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Marital Status</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.maritalStatus || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader><CardTitle>Employment Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">Employee Code</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.empCode || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Department</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.department || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Designation</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.designation || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Role</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{(employee.user?.role ?? employee.role) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Employment Type</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.employmentType || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Status</p>
              <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'danger'} className="mt-1">
                {employee.status || '-'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Date of Joining</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">Current Address</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.currentAddress || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Permanent Address</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.permanentAddress || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">City</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.city || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pincode</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.pincode || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Personal Mobile</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.personalMobile || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Banking & Identification */}
        <Card>
          <CardHeader><CardTitle>Banking & Identification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">PAN Number</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.panNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Aadhar Number</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.aadharNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">PF Number</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.pfNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">UAN Number</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.uanNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bank Account Number</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.bankAccountNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bank Name</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.bankName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">IFSC Code</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employee.ifscCode || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateEmployeeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEmployeeUpdated}
        mode="edit"
        employeeId={employee?.id}
        initialData={profileInitialData}
      />

    </div>
  );
};

export default EmployeeProfile;