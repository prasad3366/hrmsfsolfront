import { describe, expect, it, vi } from 'vitest';
import attendanceService from './attendanceService';
import ApiService from './api';

describe('attendanceService', () => {
  it('delegates employee loading to the scoped attendance API method', async () => {
    const response = { data: [{ id: 42 }] } as any;
    const getAttendanceEmployees = vi.spyOn(ApiService, 'getAttendanceEmployees').mockResolvedValue(response);

    await expect(attendanceService.getAttendanceEmployees('Ada')).resolves.toBe(response);
    expect(getAttendanceEmployees).toHaveBeenCalledWith('Ada');

    getAttendanceEmployees.mockRestore();
  });
});