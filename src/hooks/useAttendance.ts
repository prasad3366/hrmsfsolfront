import { useState, useEffect, useMemo } from 'react';
import ApiService, { AttendanceRecord, TodayAttendanceStatus } from '../services/api';

export interface UseAttendanceOptions {
  /**
   * Which attendance to load.
   * - "me" loads current user's history (default)
   * - "all" loads all employees' attendance (for HR/Manager views)
   * - "employee" loads a single employee's attendance (requires employeeId)
   */
  scope?: 'me' | 'all' | 'employee';
  employeeId?: number;
}

export interface UseAttendanceReturn {
  records: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  todayRecord: TodayAttendanceStatus | undefined;
  punchIn: (latitude?: number, longitude?: number) => Promise<void>;
  punchOut: (latitude?: number, longitude?: number) => Promise<void>;
}

/**
 * Hook to fetch attendance records
 */
export const useAttendance = (options: UseAttendanceOptions = {}): UseAttendanceReturn => {
  const { scope = 'me', employeeId } = options;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<TodayAttendanceStatus | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: AttendanceRecord[] = [];

      if (scope === 'all') {
        data = await ApiService.getAttendance();
      } else if (scope === 'employee' && typeof employeeId === 'number') {
        data = await ApiService.getEmployeeAttendance(employeeId);
      } else {
        data = await ApiService.getMyAttendance();
      }

      setRecords(data);

      // Also refresh today record if available
      try {
        const today = await ApiService.getTodayStatus();
        setTodayRecord(today ?? undefined);
      } catch (err) {
        // If not available, just keep previous state
        console.warn('Failed to fetch today attendance status:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
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
  }, [scope, employeeId]);

  return {
    records,
    isLoading,
    error,
    refresh: fetchAttendance,
    todayRecord,
    punchIn,
    punchOut,
  };
};
