import { describe, expect, it } from 'vitest';
import { getEmployeeAttendanceLocationLabel } from './EmployeeAttendance';

describe('Employee Attendance location display', () => {
  it.each([
    ['OFFICE', 'OFFICE', 'In Office'],
    ['OFFICE', 'OUTSIDE', 'Checked Out Outside Office'],
    ['OUTSIDE', 'OFFICE', 'Checked In Outside Office'],
    ['OUTSIDE', 'OUTSIDE', 'Out of Office'],
  ] as const)('maps %s + %s to %s', (punchIn, punchOut, expected) => {
    expect(getEmployeeAttendanceLocationLabel(punchIn, punchOut)).toBe(expected);
  });

  it.each([
    [undefined, undefined],
    ['OFFICE', undefined],
    [undefined, 'OFFICE'],
    ['WFH', 'OFFICE'],
    ['OFFICE', 'WFH'],
  ] as const)('maps incomplete location data to Unknown', (punchIn, punchOut) => {
    expect(getEmployeeAttendanceLocationLabel(punchIn, punchOut)).toBe('Unknown');
  });
});
