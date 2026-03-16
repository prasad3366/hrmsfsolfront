import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '../../components/ui/components';
import { CreateLeaveDto } from '../../services/api';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateLeaveDto) => Promise<void>;
  isSubmitting?: boolean;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  if (!isOpen) return null;
  const [formData, setFormData] = useState({
    leaveTypeId: 1,
    startDate: '',
    endDate: '',
    durationType: 'FULL_DAY' as 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({
        leaveTypeId: 1,
        startDate: '',
        endDate: '',
        durationType: 'FULL_DAY',
        reason: '',
      });
      onClose();
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Apply for Leave</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0 ml-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <select
                value={formData.leaveTypeId.toString()}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <option value="1">Casual Leave</option>
                <option value="2">Sick Leave</option>
                <option value="3">Privilege Leave</option>
                <option value="4">Comp Off</option>
                <option value="5">Maternity Leave</option>
                <option value="6">Paternity Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration Type</label>
              <select
                value={formData.durationType}
                onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND' })}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY_FIRST">Half Day (First Half)</option>
                <option value="HALF_DAY_SECOND">Half Day (Second Half)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request"
              rows={5}
              required
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} onClick={handleSubmit} className="w-full sm:w-auto">
            {isSubmitting ? 'Submitting...' : 'Apply Leave'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;
