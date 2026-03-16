import React, { useState } from 'react';
import { Dialog, Button, Input, Label } from '../../components/ui/components';
import { usePayroll } from '../../hooks/usePayroll';

interface AddPayrollAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollId: number;
  onSuccess?: () => void;
}

export const AddPayrollAdjustmentModal: React.FC<AddPayrollAdjustmentModalProps> = ({
  isOpen,
  onClose,
  payrollId,
  onSuccess,
}) => {
  const { addPayrollAdjustment, loading, error } = usePayroll();
  const [formData, setFormData] = useState({
    name: '',
    type: 'ALLOWANCE' as 'ALLOWANCE' | 'DEDUCTION',
    amount: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? value : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPayrollAdjustment(
        payrollId,
        formData.name,
        formData.type,
        parseInt(formData.amount, 10)
      );
      
      // Reset form
      setFormData({
        name: '',
        type: 'ALLOWANCE',
        amount: '',
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
        <h2 className="text-xl font-bold mb-4 text-slate-900">Add Adjustment</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold text-sm">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Adjustment Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Bonus, Medical, etc."
            />
          </div>

          <div>
            <Label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALLOWANCE">Allowance</option>
              <option value="DEDUCTION">Deduction</option>
            </select>
          </div>

          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
              Amount
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              required
              placeholder="Enter amount"
            />
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
              {loading ? 'Adding...' : 'Add Adjustment'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
