import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../../components/ui/components';
import { X, Loader, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import ApiService, { CreateEmployeeDto } from '../../services/api';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: any) => void;
  mode?: 'create' | 'edit';
  initialData?: Partial<CreateEmployeeDto>;
  employeeId?: number;
}

// Helper functions to reduce complexity
const normalizeDto = (data?: Partial<CreateEmployeeDto>): CreateEmployeeDto => ({
  email: data?.email ?? '',
  firstName: data?.firstName ?? '',
  lastName: data?.lastName ?? '',
  empCode: data?.empCode ?? '',
  department: data?.department ?? '',
  designation: data?.designation ?? '',
  role: data?.role ?? 'EMPLOYEE',
  employmentType: data?.employmentType ?? 'FULL_TIME',
  status: data?.status ?? 'ACTIVE',
  sourceOfHire: data?.sourceOfHire ?? '',
  dateOfJoining: data?.dateOfJoining ?? '',
  currentExperience: data?.currentExperience ?? undefined,
  reportingManager: data?.reportingManager ?? '',
  dateOfBirth: data?.dateOfBirth ?? '',
  age: data?.age ?? undefined,
  gender: data?.gender ?? 'MALE',
  currentAddress: data?.currentAddress ?? '',
  permanentAddress: data?.permanentAddress ?? '',
  pincode: data?.pincode ?? '',
  city: data?.city ?? '',
  maritalStatus: data?.maritalStatus ?? 'UNMARRIED',
  phone: data?.phone ?? '',
  personalMobile: data?.personalMobile ?? '',
  panNumber: data?.panNumber ?? '',
  aadharNumber: data?.aadharNumber ?? '',
  pfNumber: data?.pfNumber ?? '',
  uanNumber: data?.uanNumber ?? '',
  bankAccountNumber: data?.bankAccountNumber ?? '',
  bankName: data?.bankName ?? '',
  ifscCode: data?.ifscCode ?? '',
  dateOfExit: data?.dateOfExit ?? '',
  isExperienced: data?.isExperienced ?? false,
});

const validateRequiredFields = (data: CreateEmployeeDto): string | null => {
  if (!data.email || !data.firstName || !data.lastName || !data.empCode || !data.department || !data.designation) {
    return 'Please fill in all required fields';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const checkCredentialsDeactivation = (
  mode: string,
  formData: CreateEmployeeDto,
  originalData: CreateEmployeeDto | null
): boolean => {
  if (mode !== 'edit' || !originalData) return false;
  
  if (formData.status === 'INACTIVE' && originalData.status !== 'INACTIVE') {
    return true;
  }

  if (formData.dateOfExit) {
    const exitDate = new Date(formData.dateOfExit);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exitDate.setHours(0, 0, 0, 0);

    if (exitDate <= today && !originalData.dateOfExit) return true;
    
    if (originalData.dateOfExit) {
      const originalExitDate = new Date(originalData.dateOfExit);
      originalExitDate.setHours(0, 0, 0, 0);
      if (exitDate <= today && originalExitDate > today) return true;
    }
  }

  return false;
};

const getStatusBadgeClass = (status: string): string => {
  if (status === 'INACTIVE') {
    return 'bg-red-100 text-red-700 border border-red-300';
  }

  if (status === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
  }

  return 'bg-blue-100 text-blue-700 border border-blue-300';
};

const getResetFormData = (): CreateEmployeeDto => normalizeDto();

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'create',
  initialData,
  employeeId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [originalData, setOriginalData] = useState<CreateEmployeeDto | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeDto>(normalizeDto());

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const normalized = normalizeDto(initialData);
      setFormData(normalized);
      setOriginalData(normalized);
    } else if (mode === 'create') {
      setFormData(normalizeDto());
      setOriginalData(null);
    }
  }, [mode, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const credentialsWillBeDeactivated = useMemo(
    () => checkCredentialsDeactivation(mode, formData, originalData),
    [formData.status, formData.dateOfExit, originalData, mode]
  );

  const submitEmployee = async () => {
    if (mode === 'edit') {
      if (!employeeId) throw new Error('Employee ID is required for update');
      return ApiService.updateEmployee(employeeId, formData);
    }
    return ApiService.createEmployee(formData);
  };

  const getSuccessMessage = (response: any) => {
    if (mode === 'edit') {
      return `✓ ${response.message || 'Employee updated successfully'}` +
        (response.credentialsDeactivated ? ' | 🔒 User credentials have been deactivated.' : '');
    }

    return `✓ Employee created successfully! Password: ${response.password}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateRequiredFields(formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitEmployee();

      setSuccessMessage(getSuccessMessage(response));
      setShowPassword(mode !== 'edit');

      if (mode === 'create') {
        setFormData(getResetFormData());
      }

      onSuccess(response);
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
        setShowPassword(false);
      }, 2000);
    } catch (err) {
      const actionVerb = mode === 'edit' ? 'update' : 'create';
      setErrorMessage(err instanceof Error ? err.message : `Failed to ${actionVerb} employee`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
          <CardTitle>{mode === 'edit' ? 'Edit Employee' : 'Create New Employee'}</CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Credential Deactivation Warning */}
          {credentialsWillBeDeactivated && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-700">⚠️ Employee Credentials Will Be Deactivated</p>
                <p className="text-sm text-orange-600 mt-1">
                  {formData.status === 'INACTIVE' && originalData?.status !== 'INACTIVE'
                    ? 'Changing the status to INACTIVE will deactivate the employee\'s login credentials immediately.'
                    : 'Setting the Date of Exit to today or earlier will deactivate the employee\'s login credentials.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              successMessage.includes('deactivated')
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-emerald-50 border border-emerald-200'
            }`}>
              <CheckCircle size={20} className={`mt-0.5 flex-shrink-0 ${
                successMessage.includes('deactivated')
                  ? 'text-blue-600'
                  : 'text-emerald-600'
              }`} />
              <div>
                <p className={`text-sm font-semibold ${
                  successMessage.includes('deactivated')
                    ? 'text-blue-700'
                    : 'text-emerald-700'
                }`}>
                  {mode === 'edit' ? 'Employee Updated Successfully' : 'Employee Created Successfully'}
                </p>
                <p className={`text-sm mt-1 ${
                  successMessage.includes('deactivated')
                    ? 'text-blue-600'
                    : 'text-emerald-600'
                }`}>
                  {successMessage}
                </p>
                {showPassword && mode === 'create' && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-700">
                      ⚠️ Make sure to share the password with the employee. It will only be shown once.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information */}
            <div className="border-b pb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-slate-700 mb-1">
                      First Name *
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-slate-700 mb-1">
                      Last Name *
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@company.com"
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Employee Information */}
            <div className="border-b pb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Employee Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="empCode" className="block text-xs font-medium text-slate-700 mb-1">
                      Employee Code *
                    </label>
                    <Input
                      id="empCode"
                      type="text"
                      name="empCode"
                      value={formData.empCode}
                      onChange={handleChange}
                      placeholder="EMP-001"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-xs font-medium text-slate-700 mb-1">
                      Department *
                    </label>
                    <Input
                      id="department"
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Engineering"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="designation" className="block text-xs font-medium text-slate-700 mb-1">
                      Designation *
                    </label>
                    <Input
                      id="designation"
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Senior Developer"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-xs font-medium text-slate-700 mb-1">
                      Role *
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isExperienced"
                    name="isExperienced"
                    checked={formData.isExperienced}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isExperienced" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Is Experienced
                  </label>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="border-b pb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Employment Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="employmentType" className="block text-xs font-medium text-slate-700 mb-1">
                      Employment Type *
                    </label>
                    <select
                      id="employmentType"
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-xs font-medium text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="TERMINATED">Terminated</option>
                      <option value="ON_LEAVE">On Leave</option>
                    </select>
                  </div>
                </div>

                {/* Status Change Details Box (Edit Mode) */}
                {mode === 'edit' && originalData && originalData.status !== formData.status && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Status Change:</p>
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <span className="px-2 py-1 bg-white border border-blue-200 rounded">{originalData.status}</span>
                      <span className="text-blue-700">→</span>
                      <span className={`px-2 py-1 rounded font-semibold ${
                        formData.status === 'INACTIVE' 
                          ? 'bg-red-100 text-red-700 border border-red-300' 
                          : formData.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-blue-100 text-blue-700 border border-blue-300'
                      }`}>
                        {formData.status}
                      </span>
                    </div>
                    {formData.status === 'INACTIVE' && (
                      <p className="text-xs text-red-600 mt-2">⚠️ This will deactivate the employee's credentials and they will be unable to login.</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateOfJoining" className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Joining *
                    </label>
                    <Input
                      id="dateOfJoining"
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="sourceOfHire" className="block text-xs font-medium text-slate-700 mb-1">
                      Source of Hire
                    </label>
                    <Input
                      id="sourceOfHire"
                      type="text"
                      name="sourceOfHire"
                      value={formData.sourceOfHire}
                      onChange={handleChange}
                      placeholder="LinkedIn, Referral, etc."
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="currentExperience" className="block text-xs font-medium text-slate-700 mb-1">
                      Current Experience (Years)
                    </label>
                    <Input
                      id="currentExperience"
                      type="number"
                      name="currentExperience"
                      value={formData.currentExperience || ''}
                      onChange={handleChange}
                      placeholder="5"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="reportingManager" className="block text-xs font-medium text-slate-700 mb-1">
                      Reporting Manager
                    </label>
                    <Input
                      id="reportingManager"
                      type="text"
                      name="reportingManager"
                      value={formData.reportingManager}
                      onChange={handleChange}
                      placeholder="Manager Name or ID"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="border-b pb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-xs font-medium text-slate-700 mb-1">
                      Age
                    </label>
                    <Input
                      id="age"
                      type="number"
                      name="age"
                      value={formData.age || ''}
                      onChange={handleChange}
                      placeholder="25"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gender" className="block text-xs font-medium text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maritalStatus" className="block text-xs font-medium text-slate-700 mb-1">
                      Marital Status
                    </label>
                    <select
                      id="maritalStatus"
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="UNMARRIED">Unmarried</option>
                      <option value="MARRIED">Married</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 234-567-8900"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="personalMobile" className="block text-xs font-medium text-slate-700 mb-1">
                      Personal Mobile
                    </label>
                    <Input
                      id="personalMobile"
                      type="tel"
                      name="personalMobile"
                      value={formData.personalMobile}
                      onChange={handleChange}
                      placeholder="+1 987-654-3210"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="currentAddress" className="block text-xs font-medium text-slate-700 mb-1">
                    Current Address
                  </label>
                  <Input
                    id="currentAddress"
                    type="text"
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    placeholder="Street, Building, Apt No."
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="permanentAddress" className="block text-xs font-medium text-slate-700 mb-1">
                    Permanent Address
                  </label>
                  <Input
                    id="permanentAddress"
                    type="text"
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    placeholder="Street, Building, Apt No."
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <Input
                      id="city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="New York"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="pincode" className="block text-xs font-medium text-slate-700 mb-1">
                      Pincode
                    </label>
                    <Input
                      id="pincode"
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="10001"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banking & Identification */}
            <div className="border-b pb-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Banking & Identification</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="panNumber" className="block text-xs font-medium text-slate-700 mb-1">
                      PAN Number
                    </label>
                    <Input
                      id="panNumber"
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="AAABP1234C"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="aadharNumber" className="block text-xs font-medium text-slate-700 mb-1">
                      Aadhar Number
                    </label>
                    <Input
                      id="aadharNumber"
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9000"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pfNumber" className="block text-xs font-medium text-slate-700 mb-1">
                      PF Number
                    </label>
                    <Input
                      id="pfNumber"
                      type="text"
                      name="pfNumber"
                      value={formData.pfNumber}
                      onChange={handleChange}
                      placeholder="PF-123456"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="uanNumber" className="block text-xs font-medium text-slate-700 mb-1">
                      UAN Number
                    </label>
                    <Input
                      id="uanNumber"
                      type="text"
                      name="uanNumber"
                      value={formData.uanNumber}
                      onChange={handleChange}
                      placeholder="100123456789"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bankAccountNumber" className="block text-xs font-medium text-slate-700 mb-1">
                      Bank Account Number
                    </label>
                    <Input
                      id="bankAccountNumber"
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      placeholder="0123456789"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankName" className="block text-xs font-medium text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <Input
                      id="bankName"
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="State Bank of India"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ifscCode" className="block text-xs font-medium text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <Input
                      id="ifscCode"
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="SBIN0001234"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="dateOfExit" className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Exit
                    </label>
                    <Input
                      id="dateOfExit"
                      type="date"
                      name="dateOfExit"
                      value={formData.dateOfExit}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    {submittingText}
                  </>
                ) : (
                  submitText
                )}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                {mode === 'edit'
                  ? 'ℹ️ Editing employee details will update the existing profile. Email changes will also update login username. Setting status to INACTIVE or Date of Exit to today or earlier will deactivate the employee\'s credentials.'
                  : 'ℹ️ A temporary password will be generated and sent to the employee email address when creating a new employee.'}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
