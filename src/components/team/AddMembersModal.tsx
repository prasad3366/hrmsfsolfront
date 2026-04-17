import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../hooks/useTeam';
import ApiService from '../../services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
} from '../ui/components';
import { X, Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number | string;
  teamName: string;
  currentMembers?: (number | string)[];
  teamMembers?: TeamMember[];
  onSuccess?: () => void;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  currentMembers = [],
  teamMembers = [],
  onSuccess
}) => {
  const { user } = useAuth();
  const { addMembers, removeTeamMember, isLoading, error, success, reset } = useTeam();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const canManageTeam = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => {
    if (isOpen) {
      console.log('🔵 [AddMembersModal] Modal opened with currentMembers:', currentMembers);
      fetchEmployees();
      reset();
      setSelectedEmployeeIds([]);
    }
  }, [isOpen, currentMembers, reset]);

  const fetchEmployees = async () => {
    try {
      const allEmployees = await ApiService.getAllEmployees();
      console.log('📋 [AddMembersModal.fetchEmployees] Total employees from API:', allEmployees.length);
      console.log('📋 [AddMembersModal.fetchEmployees] Current team members:', currentMembers);
      
      // Filter out employees who are already in this team or are managers
      const currentMemberIds = currentMembers.map(id => Number(id));
      const availableEmployees = allEmployees.filter(emp =>
        !currentMemberIds.includes(Number(emp.id)) &&
        (emp.user?.role !== 'MANAGER' && emp.role !== 'MANAGER')
      );
      
      console.log('✅ [AddMembersModal.fetchEmployees] Available employees after filtering:', availableEmployees.length);
      console.log('👥 [AddMembersModal.fetchEmployees] Available employee IDs:', availableEmployees.map(e => e.id));
      
      setEmployees(availableEmployees);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleEmployeeToggle = (employeeId: number | string) => {
    const id = Number(employeeId);
    console.log('🔘 [AddMembersModal.handleEmployeeToggle] Toggling employee ID:', employeeId, typeof employeeId, 'converted to:', id);
    setSelectedEmployeeIds(prev => {
      const newSelected = prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id];
      console.log('🔘 [AddMembersModal.handleEmployeeToggle] Previous selected:', prev);
      console.log('🔘 [AddMembersModal.handleEmployeeToggle] New selected:', newSelected);
      return newSelected;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployeeIds.length === 0) {
      return;
    }

    console.log('🔵 [AddMembersModal] Adding members to team:', teamId);
    console.log('👥 Selected employee IDs:', selectedEmployeeIds);
    console.log('📝 Selected employees:', selectedEmployeeIds.map(id => {
      const emp = employees.find(e => Number(e.id) === id);
      return emp ? `${emp.firstName} ${emp.lastName} (${emp.id})` : `ID: ${id}`;
    }));
    
    console.log('⚠️ [AddMembersModal] Total employees in current list:', employees.length);
    console.log('⚠️ [AddMembersModal] Selecting:', selectedEmployeeIds.length, 'out of', employees.length);

    // Ensure selectedEmployeeIds are only from available employees
    const validSelectedIds = selectedEmployeeIds.filter(id => employees.some(emp => Number(emp.id) === id));
    console.log('🔍 [AddMembersModal] Valid selected IDs:', validSelectedIds);

    const result = await addMembers(teamId, { employeeIds: validSelectedIds });

    if (result) {
      console.log('✅ Members added successfully, refreshing team data...');
      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedEmployeeIds([]);
    setRemovingMemberId(null);
    reset();
  };

  const handleRemoveMember = async (employeeId: number) => {
    if (removingMemberId !== null) {
      return;
    }

    if (!window.confirm('Remove this employee from the team?')) {
      return;
    }

    setRemovingMemberId(employeeId);
    const removed = await removeTeamMember(teamId, employeeId);
    setRemovingMemberId(null);

    if (removed) {
      onSuccess?.();
      onClose();
    }
  };

  if (!isOpen || !canManageTeam) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Members to {teamName}</CardTitle>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select employees to add to the team:</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-3">
                {employees.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No available employees to add
                  </p>
                ) : (
                  employees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                          checked={selectedEmployeeIds.includes(Number(employee.id))}
                        onChange={() => handleEmployeeToggle(employee.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label
                        htmlFor={`employee-${employee.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {employee.empCode} • {employee.designation} • {employee.department}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedEmployeeIds.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedEmployeeIds.length} employee{selectedEmployeeIds.length !== 1 ? 's' : ''} selected
              </div>
            )}

            {teamMembers && teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Current Team Members</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id || member.empCode || member.name} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {member.firstName || member.lastName ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : member.name || member.empCode || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">ID: {member.id || member.empCode || 'N/A'}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removingMemberId !== null}
                        onClick={() => member.id && handleRemoveMember(member.id)}
                      >
                        {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Success</p>
                  <p className="text-sm text-green-600 mt-1">{success}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || selectedEmployeeIds.length === 0}
                className="bg-[#2A4B9B] hover:bg-[#1e3a7b] text-white"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <UserPlus className="w-4 h-4 mr-2" />
                Add Members
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};