import React, { useState, useMemo } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../components/ui/components';
import { LeaveType } from '../../services/api';

interface CarryForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leaveTypeId: number, yearStart: number) => Promise<void>;
  isSubmitting?: boolean;
  leaveBalances: LeaveType[];
}

const CarryForwardModal: React.FC<CarryForwardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  leaveBalances,
}) => {
  if (!isOpen) return null;

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
  const nextYearStart = financialYearStart + 1;

  // Filter leaves that have carryForward capability and unused balance
  const eligibleLeaves = useMemo(() => {
    return leaveBalances.filter((leave) => {
      const remaining = (leave.allocated || 0) + (leave.carryForward || 0) - (leave.used || 0);
      return remaining > 0 && leave.id; // Has remaining balance and valid ID
    });
  }, [leaveBalances]);

  const selectedLeave = eligibleLeaves.find((leave) => leave.id === selectedLeaveTypeId);
  const remainingBalance = selectedLeave
    ? (selectedLeave.allocated || 0) + (selectedLeave.carryForward || 0) - (selectedLeave.used || 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedLeaveTypeId) {
      setError('Please select a leave type');
      return;
    }

    if (currentMonth < 3) {
      setError('Carry forward can only be requested after the financial year ends (April)');
      return;
    }

    try {
      await onSubmit(selectedLeaveTypeId, financialYearStart);
      setSelectedLeaveTypeId(null);
      onClose();
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Request Carry Forward Leaves</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">How it works</p>
              <p className="text-sm text-blue-700 mt-1">
                Unused leaves from the current financial year (FY {financialYearStart}-{financialYearStart + 1}) 
                can be carried forward to the next financial year (FY {nextYearStart}-{nextYearStart + 1}), 
                subject to maximum carry forward limits.
              </p>
            </div>
          </div>

          {/* Leave Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Select Leave Type</label>
            <div className="space-y-2">
              {eligibleLeaves.length > 0 ? (
                eligibleLeaves.map((leave) => {
                  const remaining = (leave.allocated || 0) + (leave.carryForward || 0) - (leave.used || 0);
                  return (
                    <button
                      key={leave.id}
                      type="button"
                      onClick={() => setSelectedLeaveTypeId(leave.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedLeaveTypeId === leave.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900">{leave.leaveType}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Remaining: <span className="font-semibold">{remaining} days</span>
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedLeaveTypeId === leave.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-300'
                            }`}
                          >
                            {selectedLeaveTypeId === leave.id && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-slate-500 text-sm">
                    No eligible leaves to carry forward. You have used all your allocated leaves.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details for selected leave */}
          {selectedLeave && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-emerald-900">Carry Forward Details</p>
              <div className="space-y-1 text-sm text-emerald-700">
                <p>• <span className="font-medium">Leave Type:</span> {selectedLeave.leaveType}</p>
                <p>• <span className="font-medium">Remaining Balance:</span> {remainingBalance} days</p>
                <p>• <span className="font-medium">From:</span> FY {financialYearStart}-{financialYearStart + 1}</p>
                <p>• <span className="font-medium">To:</span> FY {nextYearStart}-{nextYearStart + 1}</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedLeaveTypeId}
              className="gap-2"
            >
              {isSubmitting ? 'Requesting...' : 'Request Carry Forward'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarryForwardModal;
