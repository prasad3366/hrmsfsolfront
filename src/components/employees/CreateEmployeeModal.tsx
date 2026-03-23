import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../../components/ui/components';
import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import ApiService, { CreateEmployeeDto, CreateEmployeeResponse } from '../../services/api';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: any) => void;
  mode?: 'create' | 'edit';
  initialData?: Partial<CreateEmployeeDto>;
  employeeId?: number;
}

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

  const [formData, setFormData] = useState<CreateEmployeeDto>(normalizeDto());

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(normalizeDto(initialData));
    } else if (mode === 'create') {
      setFormData(normalizeDto());
    }
  }, [mode, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate required fields
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.empCode || !formData.department || !formData.designation) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);

      let response: any;
      if (mode === 'edit') {
        if (!employeeId) {
          throw new Error('Employee ID is required for update');
        }
        response = await ApiService.updateEmployee(employeeId, formData);
        setSuccessMessage('✓ Employee updated successfully');
        setShowPassword(false);
      } else {
        response = await ApiService.createEmployee(formData);
        setSuccessMessage(`✓ Employee created successfully! Password: ${response.password}`);
        setShowPassword(true);
      }

      onSuccess(response);

      if (mode === 'create') {
        // Reset for create mode only
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          empCode: '',
          department: '',
          designation: '',
          role: 'EMPLOYEE',
          isExperienced: false,
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          sourceOfHire: '',
          dateOfJoining: '',
          currentExperience: undefined,
          reportingManager: '',
          dateOfBirth: '',
          age: undefined,
          gender: 'MALE',
          currentAddress: '',
          permanentAddress: '',
          pincode: '',
          city: '',
          maritalStatus: 'UNMARRIED',
          phone: '',
          personalMobile: '',
          panNumber: '',
          aadharNumber: '',
          pfNumber: '',
          uanNumber: '',
          bankAccountNumber: '',
          bankName: '',
          ifscCode: '',
          dateOfExit: '',
        });
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage('');
        setShowPassword(false);
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : `Failed to ${mode === 'edit' ? 'update' : 'create'} employee`);
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
          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">{mode === 'edit' ? 'Employee Updated Successfully' : 'Employee Created Successfully'}</p>
                <p className="text-sm text-emerald-600 mt-1">{successMessage}</p>
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First Name *
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last Name *
                    </label>
                    <Input
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Employee Code *
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Department *
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Designation *
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Role *
                    </label>
                    <select
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Employment Type *
                    </label>
                    <select
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Joining *
                    </label>
                    <Input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Source of Hire
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Current Experience (Years)
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Reporting Manager
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Age
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Marital Status
                    </label>
                    <select
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Personal Mobile
                    </label>
                    <Input
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Current Address
                  </label>
                  <Input
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Permanent Address
                  </label>
                  <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Pincode
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      PAN Number
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Aadhar Number
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      PF Number
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      UAN Number
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Bank Account Number
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <Input
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Exit
                    </label>
                    <Input
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
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  mode === 'edit' ? 'Update Employee' : 'Create Employee'
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
                  ? 'ℹ️ Editing employee details will update the existing profile. Email changes will also update login username.'
                  : 'ℹ️ A temporary password will be generated and sent to the employee email address when creating a new employee.'}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
