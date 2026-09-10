import { useState, useEffect, useRef } from 'react';
import ApiService, { AttendanceRecord, AttendanceHistoryResponse, TodayAttendanceStatus } from '../services/api';

export interface UseAttendanceOptions {
  /**
   * Which attendance to load.
   * - "me" loads current user's history (default)
   * - "all" loads all employees' attendance (for HR/Manager views)
   * - "employee" loads a single employee's attendance (requires employeeId)
   */
  scope?: 'me' | 'all' | 'employee';
  employeeId?: number;
  pageSize?: number;
  month?: number;
  year?: number;
}

export interface UseAttendanceReturn {
  records: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  todayRecord: TodayAttendanceStatus | undefined;
  punchIn: (latitude?: number, longitude?: number) => Promise<void>;
  punchOut: (latitude?: number, longitude?: number) => Promise<void>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
}

/**
 * Hook to fetch attendance records
 */
export const useAttendance = (options: UseAttendanceOptions = {}): UseAttendanceReturn => {
  const { scope = 'me', employeeId, pageSize = 10, month, year } = options;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AttendanceHistoryResponse['meta']>({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [todayRecord, setTodayRecord] = useState<TodayAttendanceStatus | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchAttendance = async () => {
    const requestId = ++requestIdRef.current;
    if (scope === 'me' && (month !== undefined || year !== undefined) && page !== 1) {
      setRecords([]);
      setIsLoading(true);
      setError(null);
      setPage(1);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let data: AttendanceRecord[] = [];

      if (scope === 'all') {
        data = await ApiService.getAttendance();
      } else if (scope === 'employee' && typeof employeeId === 'number') {
        data = await ApiService.getEmployeeAttendance(employeeId);
      } else {
        const now = new Date();
        const response = await ApiService.getMyAttendance(
          month ?? now.getMonth() + 1,
          year ?? now.getFullYear(),
          page,
          pageSize,
        );
        data = response.data;
        setPagination(response.meta);
      }

      if (requestId !== requestIdRef.current) return;
      setRecords(data);

      // Also refresh today record if available
      try {
        const today = await ApiService.getTodayStatus();
        if (requestId === requestIdRef.current) setTodayRecord(today ?? undefined);
      } catch (err) {
        console.warn('Failed to fetch today attendance status:', err);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setTodayRecord(undefined);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const punchIn = async (latitude?: number, longitude?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await ApiService.punchIn(latitude, longitude);
      await fetchAttendance();
      const today = await ApiService.getTodayStatus();
      setTodayRecord(today ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Punch in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const punchOut = async (latitude?: number, longitude?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await ApiService.punchOut(latitude, longitude);
      await fetchAttendance();
      const today = await ApiService.getTodayStatus();
      setTodayRecord(today ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Punch out failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [scope, employeeId, page, pageSize, month, year]);

  return {
    records,
    isLoading,
    error,
    refresh: fetchAttendance,
    todayRecord,
    punchIn,
    punchOut,
    page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages,
    setPage,
  };
};
