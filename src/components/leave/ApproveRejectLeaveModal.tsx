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
      console.error('Approve leave request failed:', error);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onReject(remarks);
      setRemarks('');
      onClose();
    } catch (error) {
      console.error('Reject leave request failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#022337]/45 p-2 backdrop-blur-[2px] sm:p-4">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-[#fffefa] shadow-[0_24px_80px_rgba(2,35,55,0.24)]">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#dce6e8] bg-[#f6faf9]/70 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-[#073b5c] sm:text-2xl">
            {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close leave approval dialog"
            className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-[#78909a] transition-colors hover:bg-[#edf3f5] hover:text-[#12354a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={actionType === 'approve' ? handleApprove : handleReject} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {leaveDetails && (
            <>
              <div className="space-y-4 rounded-xl border border-[#dce6e8] bg-[#f6faf9] p-4 sm:space-y-5 sm:p-6">
                <h3 className="mb-4 text-sm font-bold text-[#12354a]">Leave request details</h3>
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
                  <label htmlFor="rejectionRemarks" className="block text-sm font-medium text-slate-700 mb-3">Remarks (Required)</label>
                  <textarea
                    id="rejectionRemarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks for rejection"
                    rows={5}
                    required
                    className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                  />
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex flex-shrink-0 flex-col-reverse justify-end gap-3 border-t border-[#dce6e8] bg-[#f6faf9]/70 p-4 sm:flex-row sm:p-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          {actionType === 'approve' ? (
            <Button
              type="submit"
              onClick={handleApprove}
              disabled={isSubmitting}
              variant="gold"
              className="w-full bg-[#eaf7f1] text-[#19704b] hover:bg-[#d8f1e4] sm:w-auto"
            >
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleReject}
              disabled={isSubmitting}
              variant="danger"
              className="w-full sm:w-auto"
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
