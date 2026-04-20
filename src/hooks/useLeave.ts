import { useState, useCallback } from 'react';
import api, { Leave, CreateLeaveDto, LeaveBalance, LeaveType } from '../services/api';

export const useLeave = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState<LeaveType[]>([]);
  const [monthlyLeaves, setMonthlyLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Apply for leave
  const applyLeave = useCallback(async (leaveDto: CreateLeaveDto) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const newLeave = await api.applyLeave(leaveDto);
      setMyLeaves((prev) => [newLeave, ...prev]);
      setSuccess('Leave request submitted successfully');
      return newLeave;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply leave';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Approve leave
  const approveLeave = useCallback(async (leaveId: number) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedLeave = await api.approveLeave(leaveId);
      setPendingLeaves((prev) =>
        prev.map((leave) => (leave.id === leaveId ? { ...leave, ...updatedLeave } : leave))
      );
      setSuccess('Leave approved successfully');
      return updatedLeave;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve leave';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Reject leave
  const rejectLeave = useCallback(async (leaveId: number, remarks: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedLeave = await api.rejectLeave(leaveId, remarks);
      setPendingLeaves((prev) =>
        prev.map((leave) => (leave.id === leaveId ? { ...leave, ...updatedLeave } : leave))
      );
      setSuccess('Leave rejected successfully');
      return updatedLeave;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject leave';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Fetch leave history
  const fetchLeaveHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getLeaveHistory();
      setLeaves(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch my leave history
  const fetchMyLeaveHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSelfLeaveHistory();
      setMyLeaves(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch your leave history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pending leaves (including approved/rejected active requests until endDate)
  const fetchPendingLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pending = await api.getPendingLeaves();
      const allLeaves = await api.getLeaveHistory();
      
      const today = new Date();
      const activeResolved = (allLeaves || []).filter((leave: Leave) => {
        const endDate = new Date(leave.endDate);
        return (
          (leave.status === 'APPROVED' || leave.status === 'REJECTED') &&
          endDate >= today
        );
      });

      const combined = [...pending, ...activeResolved];
      
      // Deduplicate by ID, keeping the most recently updated one
      const uniqueMap = new Map<number, Leave>();
      combined.forEach((leave) => {
        const existing = uniqueMap.get(leave.id);
        if (!existing || new Date(leave.updatedAt) > new Date(existing.updatedAt)) {
          uniqueMap.set(leave.id, leave);
        }
      });

      setPendingLeaves(Array.from(uniqueMap.values()));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending leaves';
      setError(errorMessage);
      console.error('Error in fetchPendingLeaves:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leave balance
  const fetchLeaveBalance = useCallback(async (yearStart: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getLeaveBalance(yearStart);
      setLeaveBalance(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave balance';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const normalizeLeaveAllocations = useCallback((balances: LeaveType[]): LeaveType[] => {
    const defaultAllocation: Record<string, number> = {
      'casual leave': 10,
      'sick leave': 8,
      'maternity leave': 182,
    };

    return balances.map((balance) => {
      const normalizedType = (balance.leaveType || '').toLowerCase();
      const defaultAllocated = defaultAllocation[normalizedType];

      if (defaultAllocated !== undefined && (balance.used || 0) === 0 && balance.allocated !== defaultAllocated) {
        return {
          ...balance,
          allocated: defaultAllocated,
          remaining: defaultAllocated,
        };
      }

      return balance;
    });
  }, []);

  // Fetch my leave balance
  const fetchMyLeaveBalance = useCallback(async (yearStart: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSelfLeaveBalance(yearStart);
      setMyLeaveBalance(normalizeLeaveAllocations(data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch your leave balance';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [normalizeLeaveAllocations]);

  // Fetch monthly leaves
  const fetchMonthlyLeaves = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getMonthlyLeaves(month, year);
      setMonthlyLeaves(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch monthly leaves';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request carry forward leaves
  const requestCarryForward = useCallback(async (leaveTypeId: number, yearStart: number) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.requestCarryForward(leaveTypeId, yearStart);
      setSuccess(result.message || 'Carry forward requested successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request carry forward';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    // State
    leaves,
    myLeaves,
    pendingLeaves,
    leaveBalance,
    myLeaveBalance,
    monthlyLeaves,
    isLoading,
    isSubmitting,
    error,
    success,

    // Actions
    applyLeave,
    approveLeave,
    rejectLeave,
    fetchLeaveHistory,
    fetchMyLeaveHistory,
    fetchPendingLeaves,
    fetchLeaveBalance,
    fetchMyLeaveBalance,
    fetchMonthlyLeaves,
    requestCarryForward,
  };
};
