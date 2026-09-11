import { useState, useEffect, useRef } from 'react';
import ApiService, { AttendanceRecord, AttendanceHistoryResponse, TodayAttendanceStatus } from '../services/api';

export type AttendanceUiState = 'NOT_CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'LEAVE';

export const normalizeAttendanceStatus = (status?: string | null): AttendanceUiState | 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'LEAVE' => {
  const normalized = status?.toUpperCase();
  if (!normalized) return 'NOT_CHECKED_IN';

  switch (normalized) {
    case 'IN_PROGRESS':
    case 'CHECKED_IN':
      return 'IN_PROGRESS';
    case 'NOT_CHECKED_IN':
      return 'NOT_CHECKED_IN';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'PRESENT':
    case 'HALF_DAY':
    case 'ABSENT':
    case 'LEAVE':
      return normalized;
    default:
      return 'NOT_CHECKED_IN';
  }
};

export const getTodayAttendanceState = (todayRecord?: TodayAttendanceStatus | null): AttendanceUiState => {
  if (!todayRecord) return 'NOT_CHECKED_IN';

  return todayRecord.status ?? 'NOT_CHECKED_IN';
};

export const getRecordAttendanceState = (record?: Partial<AttendanceRecord> | null): 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'LEAVE' | 'PRESENT' | 'HALF_DAY' => {
  if (!record) return 'ABSENT';

  const recordStatus = (record.status ?? '').toUpperCase();
  const punchIn = record.punchIn ?? null;
  const punchOut = record.punchOut ?? null;

  if (recordStatus === 'LEAVE') return 'LEAVE';
  if (punchIn && !punchOut) return 'IN_PROGRESS';
  if (punchIn && punchOut) return recordStatus === 'PRESENT' || recordStatus === 'HALF_DAY' || recordStatus === 'ABSENT' ? recordStatus : 'COMPLETED';
  return 'ABSENT';
};

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
  todayError: string | null;
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
  const [todayError, setTodayError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const mutationInFlightRef = useRef(false);

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
    setTodayError(null);
    try {
      let data: AttendanceRecord[] = [];

      if (scope === 'all') {
        data = await ApiService.getAttendance();
      } else if (scope === 'employee' && typeof employeeId === 'number') {
        data = (await ApiService.getEmployeeAttendance(employeeId)).data;
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

      try {
        const today = await ApiService.getTodayStatus();
        if (requestId === requestIdRef.current) {
          setTodayRecord(today ?? undefined);
          setTodayError(null);
        }
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setTodayError(err instanceof Error ? err.message : 'Failed to fetch today attendance status');
        }
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setRecords([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const punchIn = async (latitude?: number, longitude?: number) => {
    if (mutationInFlightRef.current) return;
    mutationInFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      await ApiService.punchIn(latitude, longitude);
      const nextToday = await ApiService.getTodayStatus();
      setTodayRecord(nextToday ?? undefined);
      setTodayError(null);
      await fetchAttendance();
    } catch (err) {
      const refreshedToday = await ApiService.getTodayStatus().catch(() => null);
      if (refreshedToday) setTodayRecord(refreshedToday);
      setError(err instanceof Error ? err.message : 'Punch in failed');
    } finally {
      mutationInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const punchOut = async (latitude?: number, longitude?: number) => {
    if (mutationInFlightRef.current) return;
    mutationInFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      await ApiService.punchOut(latitude, longitude);
      const nextToday = await ApiService.getTodayStatus();
      setTodayRecord(nextToday ?? undefined);
      setTodayError(null);
      await fetchAttendance();
    } catch (err) {
      const refreshedToday = await ApiService.getTodayStatus().catch(() => null);
      if (refreshedToday) setTodayRecord(refreshedToday);
      setError(err instanceof Error ? err.message : 'Punch out failed');
    } finally {
      mutationInFlightRef.current = false;
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
    todayError,
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
