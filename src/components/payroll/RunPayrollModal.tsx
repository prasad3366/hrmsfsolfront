import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Label } from '../../components/ui/components';
import ApiService from '../../services/api';
import { usePayroll } from '../../hooks/usePayroll';
 
interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
 
export const RunPayrollModal: React.FC<RunPayrollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { runPayroll, loading, error } = usePayroll();
  const [formData, setFormData] = useState({
    employeeIdentifier: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    setEmpLoading(true);
    ApiService.getAllEmployees()
      .then((response) => {
        if (mounted === false) return;
        // Once an employee has a first payroll record, the monthly scheduler
        // takes over automatically - only show employees who haven't started yet.
        const employees = Array.isArray(response) ? response : response.data || [];
        const notStarted = employees.filter(
          (emp: any) => emp.status === 'ACTIVE' && (!emp.payrolls || emp.payrolls.length === 0),
        );
        setEmployees(notStarted);
      })
      .catch((err) => {
        setEmpError('Failed to load employees');
      })
      .finally(() => setEmpLoading(false));
    return () => { mounted = false; };
  }, []);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'month' || name === 'year' ? Number.parseInt(value, 10) : value,
    }));
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
 
    const idValue = Number.parseInt(formData.employeeIdentifier, 10);
    const isNumericId = Number.isNaN(idValue) === false;
 
 
    // Only include employeeId or empCode if defined, to match RunPayrollDto type
    let payload: any = {
      month: formData.month,
      year: formData.year,
    };
    if (isNumericId) {
      payload.employeeId = idValue;
    } else if (formData.employeeIdentifier.trim()) {
      payload.empCode = formData.employeeIdentifier.trim();
    }
 
    if (!payload.employeeId && !payload.empCode) {
      alert('Please enter a valid employee ID or employee code.');
      return;
    }
 
    try {
      await runPayroll(payload);
 
      // Reset form
      setFormData({
        employeeIdentifier: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
 
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to run payroll:', err);
    }
  };
 
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/70 bg-[#fffefa] p-6 shadow-[0_24px_80px_rgba(2,35,55,0.24)]">
        <h2 className="mb-1 text-xl font-bold text-[#073b5c]">Run payroll</h2>
        <p className="mb-4 text-xs text-[#617984]">
          For an employee's first payroll only. Once generated, their payroll runs automatically every month.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-[#f3c9c3] bg-[#fff1ef] p-4">
            <p className="text-sm font-semibold text-[#a63e35]">Error</p>
            <p className="mt-1 text-sm text-[#a63e35]">{error}</p>
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employeeIdentifier" className="block text-sm font-medium text-slate-700 mb-1">
              Employee ID or Code
            </Label>
            <select
              id="employeeIdentifier"
              name="employeeIdentifier"
              value={formData.employeeIdentifier}
              onChange={handleChange}
              required
              className="h-10 w-full rounded-xl border border-[#cbd9dc] bg-white px-3 py-2 text-sm text-[#12354a] focus:border-[#b08a3e] focus:outline-none focus:ring-2 focus:ring-[#b08a3e]/20"
            >
              <option value="">Select employee...</option>
              {empLoading && <option>Loading...</option>}
              {empError && <option disabled>{empError}</option>}
              {!empLoading && !empError && employees.length === 0 && (
                <option disabled>No employees pending their first payroll</option>
              )}
              {employees.map((emp) => (
                <option key={emp.id || emp.employeeId || emp.empCode}
                  value={emp.id || emp.employeeId || emp.empCode}
                >
                  {emp.firstName || emp.name || emp.empCode} {emp.lastName || ''} {emp.empCode ? `(${emp.empCode})` : ''}
                </option>
              ))}
            </select>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month" className="block text-sm font-medium text-slate-700 mb-1">
                Month
              </Label>
              <select
                id="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="h-10 w-full rounded-xl border border-[#cbd9dc] bg-white px-3 py-2 text-sm text-[#12354a] focus:border-[#b08a3e] focus:outline-none focus:ring-2 focus:ring-[#b08a3e]/20"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
            </div>
 
            <div>
              <Label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-1">
                Year
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>
          </div>
 
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Running...' : 'Run Payroll'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
 
 