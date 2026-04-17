import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';
import { Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useLeave } from '../../hooks/useLeave';
import { useAuth } from '../../context/AuthContext';
import ApplyLeaveModal from '../../components/leave/ApplyLeaveModal';
import ApproveRejectLeaveModal from '../../components/leave/ApproveRejectLeaveModal';
import ApiService from '../../services/api';
import { CreateLeaveDto } from '../../services/api';

const LeaveBalanceCard = ({ type, total, used, color, ...props }: { type: string, total: number, used: number, color: string, [key: string]: any }) => {
    const percentage = (used / total) * 100;
    const colors: Record<string, string> = {
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        orange: "bg-amber-500",
        rose: "bg-rose-500"
    };
    
    return (
        <Card className="overflow-hidden" hoverEffect>
            <div className={`h-2 w-full ${colors[color]}`}></div>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{type}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{total - used} <span className="text-sm font-normal text-slate-400">/ {total}</span></h3>
                    </div>
                    <div className={`p-2 rounded-lg ${colors[color]} bg-opacity-10 text-${color}-600`}>
                        <Calendar size={18} className={color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-amber-600'} />
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full ${colors[color]}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-xs text-slate-400">{used} days consumed</p>
            </CardContent>
        </Card>
    );
};

const LeaveManagement = () => {
  const { user } = useAuth();
  const {
    myLeaves,
    myLeaveBalance,
    pendingLeaves,
    isLoading,
    isSubmitting,
    error,
    success,
    applyLeave,
    approveLeave,
    rejectLeave,
    fetchMyLeaveHistory,
    fetchMyLeaveBalance,
    fetchPendingLeaves,
  } = useLeave();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [approveRejectModal, setApproveRejectModal] = useState({
    isOpen: false,
    leaveId: 0,
    action: 'approve' as 'approve' | 'reject',
    leaveDetails: {
      employeeName: '',
      type: '',
      dates: '',
      reason: '',
    },
  });

  const [employeeMap, setEmployeeMap] = useState<Record<number | string, string >>({});

  const getEmployeeName = (leave: any) => {
    // Simple direct approach - backend now provides full employee data
    if (leave.employee?.firstName || leave.employee?.lastName) {
      return `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim();
    }
    if (leave.employee?.empCode) {
      return leave.employee.empCode;
    }
    return 'Unknown';
  };

  const currentYear = new Date().getFullYear();
  const financialYearStart = new Date().getMonth() >= 3 ? currentYear : currentYear - 1;

  // Initial data load
  useEffect(() => {
    fetchMyLeaveHistory();
    fetchMyLeaveBalance(financialYearStart);
    if (user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') {
      fetchPendingLeaves();
    }
  }, [user?.role, fetchMyLeaveHistory, fetchMyLeaveBalance, fetchPendingLeaves, financialYearStart]);

  // Show notifications
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {}, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleApplyLeave = async (dto: CreateLeaveDto) => {
    try {
      await applyLeave(dto);
      setIsApplyModalOpen(false);
      // Refresh leave balance after applying for leave
      fetchMyLeaveBalance(financialYearStart);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    try {
      await approveLeave(leaveId);
      setApproveRejectModal({ ...approveRejectModal, isOpen: false });
      // Refresh pending leaves
      fetchPendingLeaves();
      // Refresh leave balance in case it affects the current user's balance
      fetchMyLeaveBalance(financialYearStart);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleRejectLeave = async (leaveId: number, remarks: string) => {
    try {
      await rejectLeave(leaveId, remarks);
      setApproveRejectModal({ ...approveRejectModal, isOpen: false });
      // Refresh pending leaves
      fetchPendingLeaves();
      // Refresh leave balance in case it affects the current user's balance
      fetchMyLeaveBalance(financialYearStart);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const openApproveModal = (leave: any) => {
    const employeeName = leave.employee
      ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
      : 'Unknown';
    
    setApproveRejectModal({
      isOpen: true,
      leaveId: leave.id,
      action: 'approve',
      leaveDetails: {
        employeeName: employeeName || 'Unknown',
        type: leave.leaveType?.name || 'Leave',
        dates: `${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`,
        reason: leave.reason || 'No reason provided',
      },
    });
  };

  const openRejectModal = (leave: any) => {
    const employeeName = leave.employee
      ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
      : 'Unknown';
    
    setApproveRejectModal({
      isOpen: true,
      leaveId: leave.id,
      action: 'reject',
      leaveDetails: {
        employeeName: employeeName || 'Unknown',
        type: leave.leaveType?.name || 'Leave',
        dates: `${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`,
        reason: leave.reason || 'No reason provided',
      },
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-600 flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-600">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-slate-500 text-sm">Track balances and manage requests</p>
        </div>
        <Button className="gap-2" onClick={() => setIsApplyModalOpen(true)}>
            <Plus size={16} /> Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {myLeaveBalance && myLeaveBalance.length > 0 ? (
          myLeaveBalance.map((balance, idx) => (
            <LeaveBalanceCard
              key={idx}
              type={balance.leaveType}
              total={balance.allocated}
              used={balance.used}
              color={['blue', 'rose', 'purple', 'orange'][idx % 4]}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-slate-500">
            {isLoading ? 'Loading leave balance...' : 'No leave balance data available'}
          </div>
        )}
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" hoverEffect>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Pending Leave Requests</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                  {pendingLeaves.length > 0 ? (
                    <div className="w-full inline-block min-w-full">
                      <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px] sm:min-w-[120px]">Employee</TableHead>
                                <TableHead className="min-w-[70px] sm:min-w-[80px]">Type</TableHead>
                                <TableHead className="min-w-[110px] sm:min-w-[140px]">Dates</TableHead>
                                <TableHead className="min-w-[50px] sm:min-w-[60px]">Days</TableHead>
                                <TableHead className="hidden lg:table-cell min-w-[120px]">Reason</TableHead>
                                <TableHead className="min-w-[140px] sm:min-w-[180px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {pendingLeaves.map(leave => (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-medium text-slate-900 text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]">
                                      {getEmployeeName(leave)}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]">{leave.leaveType?.name || 'Leave'}</TableCell>
                                    <TableCell className="text-xs text-slate-500 whitespace-nowrap min-w-[110px] sm:min-w-[140px]">
                                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm text-center min-w-[50px] sm:min-w-[60px]">{leave.totalDays}</TableCell>
                                    <TableCell className="text-xs text-slate-500 max-w-[120px] truncate">{leave.reason || 'No reason provided'}</TableCell>
                                    <TableCell className="min-w-[140px] sm:min-w-[180px]">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                                            {leave.status === 'PENDING' ? (
                                              <>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline" 
                                                  className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 text-xs px-2 py-1 whitespace-nowrap"
                                                  onClick={() => openApproveModal(leave)}
                                                  disabled={isSubmitting}
                                                >
                                                  Approve
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline" 
                                                  className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs px-2 py-1 whitespace-nowrap"
                                                  onClick={() => openRejectModal(leave)}
                                                  disabled={isSubmitting}
                                                >
                                                  Reject
                                                </Button>
                                              </>
                                            ) : (
                                              <Badge variant={getStatusBadgeVariant(leave.status)}>
                                                {leave.status}
                                              </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      {isLoading ? 'Loading pending leaves...' : 'No pending leave requests'}
                    </div>
                  )}
              </CardContent>
          </Card>

          <Card hoverEffect>
              <CardHeader><CardTitle className="text-base">Upcoming Holidays</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  {[
                      { name: "Thanksgiving", date: "24 Nov", day: "Thursday" },
                      { name: "Christmas", date: "25 Dec", day: "Sunday" },
                      { name: "New Year", date: "01 Jan", day: "Sunday" }
                  ].map((h, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm text-slate-800 border border-slate-100 font-bold leading-tight">
                              <span className="text-sm">{h.date.split(' ')[0]}</span>
                              <span className="text-[10px] uppercase text-slate-400">{h.date.split(' ')[1]}</span>
                          </div>
                          <div>
                              <p className="text-sm font-bold text-slate-900">{h.name}</p>
                              <p className="text-xs text-slate-500">{h.day}</p>
                          </div>
                      </div>
                  ))}
              </CardContent>
          </Card>
        </div>
      )}

      <Card hoverEffect>
        <CardHeader><CardTitle className="text-base">Your Leave History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {myLeaves.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {myLeaves.map(leave => (
                        <TableRow key={leave.id}>
                            <TableCell className="font-medium text-slate-900">{leave.leaveType?.name || 'Leave'}</TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{leave.totalDays}</TableCell>
                            <TableCell className="text-xs text-slate-500">{leave.reason}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(leave.status)}>
                                    {leave.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
          ) : (
            <div className="p-6 text-center text-slate-500">
              {isLoading ? 'Loading your leave history...' : 'No leave requests yet'}
            </div>
          )}
        </CardContent>
      </Card>

      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplyLeave}
        isSubmitting={isSubmitting}
      />

      <ApproveRejectLeaveModal
        isOpen={approveRejectModal.isOpen}
        onClose={() => setApproveRejectModal({ ...approveRejectModal, isOpen: false })}
        onApprove={() => handleApproveLeave(approveRejectModal.leaveId)}
        onReject={(remarks) => handleRejectLeave(approveRejectModal.leaveId, remarks)}
        leaveDetails={approveRejectModal.leaveDetails}
        isSubmitting={isSubmitting}
        actionType={approveRejectModal.action}
      />
    </div>
  );
};

export default LeaveManagement;