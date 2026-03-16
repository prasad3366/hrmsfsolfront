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
        prev.map((leave) => (leave.id === leaveId ? updatedLeave : leave))
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
        prev.map((leave) => (leave.id === leaveId ? updatedLeave : leave))
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

  // Fetch pending leaves
  const fetchPendingLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPendingLeaves();
      setPendingLeaves(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending leaves';
      setError(errorMessage);
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

  // Fetch my leave balance
  const fetchMyLeaveBalance = useCallback(async (yearStart: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSelfLeaveBalance(yearStart);
      setMyLeaveBalance(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch your leave balance';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  };
};
