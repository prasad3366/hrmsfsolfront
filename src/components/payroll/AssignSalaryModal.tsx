import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Label } from '../../components/ui/components';
import { useSalary } from '../../hooks/useSalary';

interface AssignSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignSalaryModal: React.FC<AssignSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { assignSalary, loading, error } = useSalary();
  const [formData, setFormData] = useState({
    employeeId: '',
    empCode: '',
    annualCTC: '',
    structureId: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError(null);
    setSuccessMessage(null); // Clear success message when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submitting
    const employeeId = formData.employeeId ? parseInt(formData.employeeId, 10) : undefined;
    const annualCTC = parseInt(formData.annualCTC, 10);
    const structureId = parseInt(formData.structureId, 10);

    if (!formData.employeeId && !formData.empCode) {
      setValidationError('Either Employee ID or Employee Code is required');
      return;
    }

    if (formData.employeeId && (isNaN(employeeId!) || employeeId! <= 0)) {
      setValidationError('Employee ID must be a valid positive number');
      return;
    }

    if (!formData.annualCTC || isNaN(annualCTC) || annualCTC <= 0) {
      setValidationError('Annual CTC must be a valid positive number');
      return;
    }

    if (!formData.structureId || isNaN(structureId) || structureId <= 0) {
      setValidationError('Salary Structure ID must be a valid positive number');
      return;
    }

    try {
      await assignSalary({
        ...(employeeId ? { employeeId } : {}),
        ...(formData.empCode ? { empCode: formData.empCode } : {}),
        annualCTC,
        structureId,
      });
      
      // Show success message
      setSuccessMessage('Salary assigned successfully!');
      setValidationError(null);
      
      // Reset form
      setFormData({
        employeeId: '',
        empCode: '',
        annualCTC: '',
        structureId: '',
      });
      
      // Call onSuccess callback
      onSuccess?.();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      // Error is handled in hook and displayed below
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Assign Salary</h2>
        
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-emerald-800 font-semibold text-sm">Success</p>
            <p className="text-emerald-700 text-sm mt-1">{successMessage}</p>
          </div>
        )}
        
        {(error || validationError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold text-sm">Error</p>
            <p className="text-red-700 text-sm mt-1">{error || validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 mb-1">
              Employee ID
            </Label>
            <Input
              id="employeeId"
              name="employeeId"
              type="number"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="e.g., 1"
              min="1"
              disabled={loading || !!successMessage}
            />
            <p className="text-xs text-slate-500 mt-1">Optional: Use Employee ID or Employee Code</p>
          </div>

          <div>
            <Label htmlFor="empCode" className="block text-sm font-medium text-slate-700 mb-1">
              Employee Code
            </Label>
            <Input
              id="empCode"
              name="empCode"
              type="text"
              value={formData.empCode}
              onChange={handleChange}
              placeholder="e.g., EMP001"
              disabled={loading || !!successMessage}
            />
            <p className="text-xs text-slate-500 mt-1">Optional: Use Employee Code or Employee ID</p>
          </div>

          <div>
            <Label htmlFor="annualCTC" className="block text-sm font-medium text-slate-700 mb-1">
              Annual CTC <span className="text-red-500">*</span>
            </Label>
            <Input
              id="annualCTC"
              name="annualCTC"
              type="number"
              value={formData.annualCTC}
              onChange={handleChange}
              required
              placeholder="e.g., 600000"
              min="1"
              disabled={loading || !!successMessage}
            />
            <p className="text-xs text-slate-500 mt-1">Annual salary in rupees</p>
          </div>

          <div>
            <Label htmlFor="structureId" className="block text-sm font-medium text-slate-700 mb-1">
              Salary Structure ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="structureId"
              name="structureId"
              type="number"
              value={formData.structureId}
              onChange={handleChange}
              required
              placeholder="e.g., 1"
              min="1"
              disabled={loading || !!successMessage}
            />
            <p className="text-xs text-slate-500 mt-1">ID of the salary structure to apply</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading || !!successMessage}
            >
              {successMessage ? 'Close' : 'Cancel'}
            </Button>
            {!successMessage && (
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Assigning...' : 'Assign Salary'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Dialog>
  );
};
