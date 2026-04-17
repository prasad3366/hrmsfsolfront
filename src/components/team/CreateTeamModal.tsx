import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../hooks/useTeam';
import ApiService, { CreateTeamDto } from '../../services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
} from '../ui/components';
import { X, Loader2, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (team?: any) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { createTeam, isLoading, error, success, reset } = useTeam();
  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    managerId: '',
    employeeIds: []
  });
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const canCreateTeams = user?.role === 'ADMIN' || user?.role === 'HR';
  const hasFetchedOnOpen = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasFetchedOnOpen.current = false;
      return;
    }

    if (!hasFetchedOnOpen.current) {
      hasFetchedOnOpen.current = true;
      reset();
      setFormData({ name: '', managerId: '', employeeIds: [] });
      setSelectedEmployeeIds([]);
      fetchManagersAndEmployees();
    }
  }, [isOpen, reset]);

  const fetchManagersAndEmployees = async () => {
    setLoadingData(true);
    try {
      const allEmployees = await ApiService.getAllEmployees();
      
      // Filter managers (employees with MANAGER role)
      const managerList = allEmployees.filter(emp => 
        emp.user?.role === 'MANAGER' || emp.role === 'MANAGER'
      );
      
      // Filter non-manager employees
      const employeeList = allEmployees.filter(emp => 
        !(emp.user?.role === 'MANAGER' || emp.role === 'MANAGER')
      );
      
      console.log('📋 [CreateTeamModal.fetchManagersAndEmployees] Managers:', managerList.length);
      console.log('📋 [CreateTeamModal.fetchManagersAndEmployees] Employees:', employeeList.length);
      
      setManagers(managerList);
      setEmployees(employeeList);
    } catch (err) {
      console.error('Failed to fetch managers and employees:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      managerId: value
    }));
  };

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a team name');
      return;
    }

    if (!formData.managerId.trim()) {
      alert('Please select a manager');
      return;
    }

    console.log('🔵 [CreateTeamModal] Creating team with data:', {
      name: formData.name,
      managerId: formData.managerId,
      employeeIds: selectedEmployeeIds
    });

    const result = await createTeam({
      ...formData,
      employeeIds: selectedEmployeeIds
    });

    if (result) {
      console.log('✅ Team created successfully');
      onSuccess?.(result);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ name: '', managerId: '', employeeIds: [] });
    setSelectedEmployeeIds([]);
    reset();
  };

  if (!isOpen || !canCreateTeams) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Team</CardTitle>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(80vh-100px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter team name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || loadingData}
              />
            </div>

            {/* Manager Selection */}
            <div className="space-y-2">
              <Label htmlFor="managerId">Select Manager *</Label>
              <select
                id="managerId"
                name="managerId"
                value={formData.managerId}
                onChange={handleManagerChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoading || loadingData || managers.length === 0}
              >
                <option value="">-- Select a Manager --</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.empCode}>
                    {manager.firstName} {manager.lastName} ({manager.empCode})
                  </option>
                ))}
              </select>
              {loadingData && (
                <p className="text-sm text-gray-500">Loading managers...</p>
              )}
              {!loadingData && managers.length === 0 && (
                <p className="text-sm text-red-500">No managers available</p>
              )}
            </div>

            {/* Team Members Selection */}
            <div className="space-y-2">
              <Label>Select Team Members (Optional)</Label>
              {!loadingData && employees.length > 0 ? (
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        checked={selectedEmployeeIds.includes(employee.id)}
                        onChange={() => handleEmployeeToggle(employee.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <span className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <span className="text-gray-500 ml-2">
                          {employee.empCode}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md text-center text-sm text-gray-500">
                  {loadingData ? 'Loading employees...' : 'No employees available'}
                </div>
              )}
              {selectedEmployeeIds.length > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedEmployeeIds.length} member{selectedEmployeeIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Success</p>
                  <p className="text-sm text-green-600 mt-1">{success}</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || loadingData || !formData.name.trim() || !formData.managerId}
                className="bg-[#2A4B9B] hover:bg-[#1e3a7b] text-white"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Users className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
