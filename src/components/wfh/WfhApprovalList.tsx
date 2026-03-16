import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { WfhRequest } from '../../services/api';
import { useWfh } from '../../hooks/useWfh';
import { useNotifications } from '../../context/NotificationContext';

interface WfhApprovalListProps {
  requests: WfhRequest[];
  isLoading: boolean;
  onRefresh: () => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  action: 'approve' | 'reject' | null;
  requestId: number | null;
  employeeName: string;
}

export const WfhApprovalList: React.FC<WfhApprovalListProps> = ({
  requests,
  isLoading,
  onRefresh,
}) => {
  const { approveWfh, rejectWfh, isSubmitting, error, success, clearMessages } = useWfh();
  const { addNotification } = useNotifications();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    action: null,
    requestId: null,
    employeeName: '',
  });

  const handleApproveClick = (request: WfhRequest) => {
    setConfirmDialog({
      isOpen: true,
      action: 'approve',
      requestId: request.id,
      employeeName: request.employee
        ? `${request.employee.firstName} ${request.employee.lastName}`
        : 'Employee',
    });
  };

  const handleRejectClick = (request: WfhRequest) => {
    setConfirmDialog({
      isOpen: true,
      action: 'reject',
      requestId: request.id,
      employeeName: request.employee
        ? `${request.employee.firstName} ${request.employee.lastName}`
        : 'Employee',
    });
  };

  const handleConfirmAction = async () => {
    if (
      !confirmDialog.action ||
      confirmDialog.requestId === null
    ) {
      return;
    }

    try {
      if (confirmDialog.action === 'approve') {
        await approveWfh(confirmDialog.requestId);
        addNotification({
          type: 'wfh_approved',
          title: 'WFH Request Approved',
          message: `${confirmDialog.employeeName}'s work from home request has been approved.`,
        });
      } else {
        await rejectWfh(confirmDialog.requestId);
        addNotification({
          type: 'wfh_rejected',
          title: 'WFH Request Rejected',
          message: `${confirmDialog.employeeName}'s work from home request has been rejected.`,
        });
      }
      setConfirmDialog({ isOpen: false, action: null, requestId: null, employeeName: '' });
      onRefresh();
    } catch (err) {
      console.error('Failed to process WFH request:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-sm font-medium">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">
            <CheckCircle size={14} />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-medium">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No WFH requests found</p>
      </div>
    );
  }

  return (
    <>
      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Department
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr
                key={request.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {request.employee
                    ? `${request.employee.firstName} ${request.employee.lastName}`
                    : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {request.employee?.department || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(request.startDate)} to {formatDate(request.endDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span title={request.reason || 'No reason provided'} className="truncate block max-w-xs">
                    {request.reason || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {request.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveClick(request)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(request)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {confirmDialog.action === 'approve'
                ? 'Approve WFH Request?'
                : 'Reject WFH Request?'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{' '}
              <span className="font-medium">
                {confirmDialog.action === 'approve' ? 'approve' : 'reject'}
              </span>{' '}
              the WFH request from <span className="font-medium">{confirmDialog.employeeName}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmDialog({ isOpen: false, action: null, requestId: null, employeeName: '' })
                }
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmDialog.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                }`}
              >
                {isSubmitting ? 'Processing...' : confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
