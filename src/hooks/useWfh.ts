import { useState, useCallback } from 'react';
import api, { WfhRequest, RequestWfhDto } from '../services/api';

export const useWfh = () => {
  const [wfhRequests, setWfhRequests] = useState<WfhRequest[]>([]);
  const [myWfhRequests, setMyWfhRequests] = useState<WfhRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // `api` is the default exported singleton instance from services/api

  // Fetch all WFH requests (for HR/Admin)
  const fetchAllWfhRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAllWfhRequests();
      setWfhRequests(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch WFH requests';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch my WFH requests (for employees)
  const fetchMyWfhRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getMyWfhRequests();
      setMyWfhRequests(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch your WFH requests';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request WFH
  const requestWfh = useCallback(async (wfh: RequestWfhDto) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const newRequest = await api.requestWfh(wfh);
      setMyWfhRequests((prev) => [newRequest, ...prev]);
      setSuccess('WFH request submitted successfully');
      return newRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request WFH';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Approve WFH request
  const approveWfh = useCallback(async (requestId: number) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedRequest = await api.approveWfh(requestId);
      setWfhRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      setSuccess('WFH request approved successfully');
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve WFH';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Reject WFH request
  const rejectWfh = useCallback(async (requestId: number) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedRequest = await api.rejectWfh(requestId);
      setWfhRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
      setSuccess('WFH request rejected successfully');
      return updatedRequest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject WFH';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    wfhRequests,
    myWfhRequests,
    isLoading,
    isSubmitting,
    error,
    success,
    fetchAllWfhRequests,
    fetchMyWfhRequests,
    requestWfh,
    approveWfh,
    rejectWfh,
    clearMessages,
  };
};
