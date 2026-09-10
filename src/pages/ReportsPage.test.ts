import { describe, expect, it } from 'vitest';
import { getSummaryValue } from './ReportsPage';

describe('Reports summary contract', () => {
  const summary = {
    totalEmployees: 42,
    todayAttendancePercentage: 91.5,
    trainingCompletionRate: 87,
    activeDepartments: 6,
  };

  it('renders the backend summary field names', () => {
    expect(getSummaryValue(summary, 'attendanceRate', 'attendance')).toBe('91.5%');
    expect(getSummaryValue(summary, 'trainingCompletionRate', 'trainingCompletion')).toBe('87%');
    expect(getSummaryValue(summary, 'activeDepartments', 'departments')).toBe(6);
    expect(getSummaryValue(summary, 'totalEmployees', 'employees')).toBe(42);
  });
});