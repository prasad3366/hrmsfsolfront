import React, { useState } from 'react';
import { Dialog, Button, Input, Label } from '../../components/ui/components';
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
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'employeeId' ? value : parseInt(value, 10),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await runPayroll({
        employeeId: parseInt(formData.employeeId, 10),
        month: formData.month,
        year: formData.year,
      });
      
      // Reset form
      setFormData({
        employeeId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Run Payroll</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold text-sm">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
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
              required
              placeholder="Enter employee ID"
            />
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
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              variant="primary"
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
