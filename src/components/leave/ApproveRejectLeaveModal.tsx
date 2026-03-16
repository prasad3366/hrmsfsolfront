import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/components';

interface ApproveRejectLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: (remarks: string) => Promise<void>;
  leaveDetails?: {
    employeeName: string;
    type: string;
    dates: string;
    reason: string;
  };
  isSubmitting?: boolean;
  actionType?: 'approve' | 'reject';
}

const ApproveRejectLeaveModal: React.FC<ApproveRejectLeaveModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  leaveDetails,
  isSubmitting,
  actionType = 'approve',
}) => {
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onApprove();
      onClose();
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onReject(remarks);
      setRemarks('');
      onClose();
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
            {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0 ml-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={actionType === 'approve' ? handleApprove : handleReject} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {leaveDetails && (
            <>
              <div className="bg-slate-50 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-5 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Leave Request Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Employee Name</p>
                    <p className="text-slate-900 font-medium text-base">{leaveDetails.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Leave Type</p>
                    <p className="text-slate-900 font-medium text-base">{leaveDetails.type}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Dates</p>
                    <p className="text-slate-900 font-medium text-base">{leaveDetails.dates}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Reason</p>
                  <p className="text-slate-900 font-medium text-base whitespace-pre-wrap">{leaveDetails.reason}</p>
                </div>
              </div>

              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Remarks (Optional)</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks for rejection"
                    rows={5}
                    className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                  />
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          {actionType === 'approve' ? (
            <Button
              type="submit"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleReject}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApproveRejectLeaveModal;
