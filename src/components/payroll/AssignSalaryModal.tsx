import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Label } from '../../components/ui/components';
import ApiService, { SalaryStructure } from '../../services/api';
import { useSalary } from '../../hooks/useSalary';

const todayDateValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/* Newest structure with a fixed conveyance is the default; otherwise the newest one */
const defaultStructureId = (structures: SalaryStructure[]) => {
  const sorted = [...structures].sort((a, b) => b.id - a.id);
  const preferred = sorted.find((structure) => structure.conveyanceAmount !== null && structure.conveyanceAmount !== undefined) ?? sorted[0];
  return preferred ? String(preferred.id) : '';
};

/* Describes the configured rule only; amounts are calculated by the backend */
const describeStructure = (structure: SalaryStructure) => {
  const conveyance = structure.conveyanceAmount !== null && structure.conveyanceAmount !== undefined
    ? `Conveyance ₹${Number(structure.conveyanceAmount).toLocaleString('en-IN')} fixed`
    : `Conveyance ${structure.conveyancePercent}% of Gross`;
  return `Basic ${structure.basicPercent}% of Gross · HRA ${structure.hraPercent}% of Basic · ${conveyance} · Special Allowance balances Gross`;
};

interface AssignSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When set, skips the unassigned-only dropdown and targets this employee
   * directly - used for giving an existing employee a raise (a new salary
   * row) from their profile, since the dropdown only lists employees who
   * have never had a salary. */
  presetEmpCode?: string;
  presetEmployeeName?: string;
}

export const AssignSalaryModal: React.FC<AssignSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  presetEmpCode,
  presetEmployeeName,
}) => {
  const isRaiseMode = !!presetEmpCode;
  const { assignSalary, loading, error } = useSalary();
  const [formData, setFormData] = useState({
    empCode: presetEmpCode || '',
    annualCTC: '',
    monthlyGross: '',
    effectiveFrom: todayDateValue(),
    structureId: '',
  });
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    ApiService.getSalaryStructures()
      .then((result) => {
        if (!mounted) return;
        const list = Array.isArray(result) ? result : [];
        setStructures(list);
        setFormData((prev) => (prev.structureId ? prev : { ...prev, structureId: defaultStructureId(list) }));
      })
      .catch(() => {
        if (mounted) setStructures([]);
      });

    return () => { mounted = false; };
  }, [isOpen]);
  const selectedStructure = structures.find((structure) => String(structure.id) === formData.structureId);
  const [employees, setEmployees] = useState<any[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen || isRaiseMode) return;

    let mounted = true;
    setEmpLoading(true);
    setEmpError(null);
    ApiService.getUnassignedEmployees()
      .then((unassignedEmployees) => {
        if (mounted) setEmployees(Array.isArray(unassignedEmployees) ? unassignedEmployees : []);
      })
      .catch(() => {
        if (mounted) {
          setEmployees([]);
          setEmpError(null);
        }
      })
      .finally(() => {
        if (mounted) setEmpLoading(false);
      });

    return () => { mounted = false; };
  }, [isOpen, isRaiseMode]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setSuccessMessage(null);
      setFormData((prev) => ({ ...prev, empCode: presetEmpCode || '' }));
    }
  }, [isOpen, presetEmpCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const annualCTC = Number.parseInt(formData.annualCTC, 10);
    const monthlyGross = Number(formData.monthlyGross);
    const structureId = Number.parseInt(formData.structureId, 10);

    if (!formData.empCode) {
      setValidationError('Employee selection is required');
      return;
    }

    if (!formData.annualCTC || Number.isNaN(annualCTC) || annualCTC <= 0) {
      setValidationError('Annual CTC must be a valid positive number');
      return;
    }

    if (!formData.monthlyGross || !Number.isFinite(monthlyGross) || monthlyGross <= 0) {
      setValidationError('Monthly Gross must be a valid positive number');
      return;
    }

    if (!formData.effectiveFrom) {
      setValidationError('Effective From date is required');
      return;
    }

    if (!formData.structureId || Number.isNaN(structureId) || structureId <= 0) {
      setValidationError('Select a salary structure');
      return;
    }

    try {
      await assignSalary({
        empCode: formData.empCode,
        annualCTC,
        monthlyGross,
        effectiveFrom: formData.effectiveFrom,
        structureId,
      });
      window.dispatchEvent(new Event('salary-assigned'));
      
      // Show success message
      setSuccessMessage(isRaiseMode ? 'Raise assigned successfully!' : 'Salary assigned successfully!');
      setValidationError(null);

      // Reset form
      setFormData({
        empCode: presetEmpCode || '',
        annualCTC: '',
        monthlyGross: '',
        effectiveFrom: todayDateValue(),
        structureId: defaultStructureId(structures),
      });
      
      // Call onSuccess callback
      onSuccess?.();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to assign salary:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/70 bg-[#fffefa] p-6 shadow-[0_24px_80px_rgba(2,35,55,0.24)]">
        <h2 className="mb-1 text-xl font-bold text-[#073b5c]">
          {isRaiseMode ? `Give Raise${presetEmployeeName ? ` - ${presetEmployeeName}` : ''}` : 'Assign Salary'}
        </h2>
        <p className="mb-4 text-xs text-[#617984]">
          {isRaiseMode
            ? 'This creates a new salary effective from the chosen date. Their previous salary and payroll history are kept.'
            : "Only employees without a salary yet are listed. To give an existing employee a raise, use their profile."}
        </p>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-[#c8ead9] bg-[#eaf7f1] p-4">
            <p className="text-sm font-semibold text-[#19704b]">Success</p>
            <p className="mt-1 text-sm text-[#19704b]">{successMessage}</p>
          </div>
        )}
        
        {(error || validationError) && (
          <div className="mb-4 rounded-xl border border-[#f3c9c3] bg-[#fff1ef] p-4">
            <p className="text-sm font-semibold text-[#a63e35]">Error</p>
            <p className="mt-1 text-sm text-[#a63e35]">{error || validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="empCode" className="block text-sm font-medium text-slate-700 mb-1">
              Employee
            </Label>
            {isRaiseMode ? (
              <Input
                id="empCode"
                value={`${presetEmployeeName || ''} (${presetEmpCode})`.trim()}
                disabled
                readOnly
              />
            ) : (
              <>
                <select
                  id="empCode"
                  name="empCode"
                  value={formData.empCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || !!successMessage || empLoading}
                >
                  <option value="">Select employee...</option>
                  {empLoading && <option>Loading...</option>}
                  {!empLoading && employees.length === 0 && (
                    <option disabled>No employees pending salary assignment</option>
                  )}
                  {employees.map((emp) => (
                    <option key={emp.id || emp.employeeId || emp.empCode}
                      value={emp.empCode}
                    >
                      {`${emp.firstName || ''} ${emp.lastName || ''}`.trim()} ({emp.empCode || '-'}) - {emp.designation || 'Designation unavailable'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Select employee by name or code</p>
              </>
            )}
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
            <Label htmlFor="monthlyGross" className="block text-sm font-medium text-slate-700 mb-1">
              Monthly Gross <span className="text-red-500">*</span>
            </Label>
            <Input
              id="monthlyGross"
              name="monthlyGross"
              type="number"
              value={formData.monthlyGross}
              onChange={handleChange}
              required
              placeholder="e.g., 50000"
              min="1"
              disabled={loading || !!successMessage}
            />
            <p className="text-xs text-slate-500 mt-1">Salary components are calculated from Gross</p>
          </div>

          <div>
            <Label htmlFor="effectiveFrom" className="block text-sm font-medium text-slate-700 mb-1">
              Effective From <span className="text-red-500">*</span>
            </Label>
            <Input
              id="effectiveFrom"
              name="effectiveFrom"
              type="date"
              value={formData.effectiveFrom}
              onChange={handleChange}
              required
              disabled={loading || !!successMessage}
            />
          </div>

          <div>
            <Label htmlFor="structureId" className="block text-sm font-medium text-slate-700 mb-1">
              Salary Structure <span className="text-red-500">*</span>
            </Label>
            <select
              id="structureId"
              name="structureId"
              value={formData.structureId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || !!successMessage}
            >
              <option value="">Select salary structure...</option>
              {structures.map((structure) => (
                <option key={structure.id} value={String(structure.id)}>{structure.name}</option>
              ))}
            </select>
            {selectedStructure && (
              <p className="text-xs text-slate-500 mt-1">{describeStructure(selectedStructure)}</p>
            )}
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
                variant="gold"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Assigning...' : isRaiseMode ? 'Give Raise' : 'Assign Salary'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Dialog>
  );
};