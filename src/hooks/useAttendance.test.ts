import { describe, expect, it } from 'vitest';
import { getTodayAttendanceState, normalizeAttendanceStatus } from './useAttendance';
import { formatAttendanceDate } from '../utils/attendanceDate';

describe('attendance state helpers', () => {
  it('treats an open attendance record as IN_PROGRESS even when clockOut is null', () => {
    expect(getTodayAttendanceState({
      hasPunchedIn: true,
      hasPunchedOut: false,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: null,
      status: 'IN_PROGRESS',
      totalHours: null,
      locationStatus: null,
    })).toBe('IN_PROGRESS');
  });

  it('uses the authoritative today response from backend and treats clockIn + null clockOut as IN_PROGRESS', () => {
    expect(getTodayAttendanceState({
      hasPunchedIn: false,
      hasPunchedOut: false,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: null,
      status: 'IN_PROGRESS',
      totalHours: null,
      locationStatus: null,
    })).toBe('IN_PROGRESS');
  });

  it('treats a null clockIn and null clockOut response as NOT_CHECKED_IN', () => {
    expect(getTodayAttendanceState({
      hasPunchedIn: false,
      hasPunchedOut: false,
      punchInTime: null,
      punchOutTime: null,
      status: 'NOT_CHECKED_IN',
      totalHours: null,
      locationStatus: null,
    })).toBe('NOT_CHECKED_IN');
  });

  it('treats a completed today response as COMPLETED', () => {
    expect(getTodayAttendanceState({
      hasPunchedIn: true,
      hasPunchedOut: true,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: '2026-09-09T17:00:00.000Z',
      status: 'COMPLETED',
      totalHours: 8,
      locationStatus: null,
    })).toBe('COMPLETED');
  });

  it('keeps approved leave non-punchable', () => {
    expect(getTodayAttendanceState({
      hasPunchedIn: false,
      hasPunchedOut: false,
      punchInTime: null,
      punchOutTime: null,
      status: 'LEAVE',
      totalHours: null,
      locationStatus: null,
    })).toBe('LEAVE');
  });

  it('renders date-only attendance values without UTC date shifting', () => {
    expect(formatAttendanceDate('2026-09-09')).toBe(
      new Date(2026, 8, 9).toLocaleDateString(),
    );
  });

  it('never converts an in-progress record into PRESENT', () => {
    expect(normalizeAttendanceStatus('IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(normalizeAttendanceStatus(null)).toBe('NOT_CHECKED_IN');
  });

  it('preserves the backend-driven classification for complete records', () => {
    expect(getTodayAttendanceState({
      hasPunchedIn: true,
      hasPunchedOut: true,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: '2026-09-09T17:00:00.000Z',
      totalHours: 8,
      status: 'COMPLETED',
      locationStatus: null,
    })).toBe('COMPLETED');

    expect(normalizeAttendanceStatus('HALF_DAY')).toBe('HALF_DAY');
    expect(normalizeAttendanceStatus('ABSENT')).toBe('ABSENT');
    expect(normalizeAttendanceStatus('LEAVE')).toBe('LEAVE');
  });
});
