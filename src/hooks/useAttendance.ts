import { useState, useEffect, useMemo } from 'react';
import ApiService, { AttendanceRecord } from '../services/api';

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
  todayRecord: AttendanceRecord | undefined;
  punchIn: (latitude?: number, longitude?: number) => Promise<void>;
  punchOut: (latitude?: number, longitude?: number) => Promise<void>;
}

/**
 * Hook to fetch attendance records
 */
export const useAttendance = (options: UseAttendanceOptions = {}): UseAttendanceReturn => {
  const { scope = 'me', employeeId } = options;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Punch out failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [scope, employeeId]);

  const todayRecord = useMemo(() => {
    const isToday = (dateString: string) => {
      try {
        const d = new Date(dateString);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      } catch {
        return false;
      }
    };

    const todays = records.filter((r) => isToday(r.date));
    if (!todays.length) return undefined;

    const currentUser = todays.find((r) => r.isCurrentUser);
    return currentUser ?? todays[0];
  }, [records]);

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
