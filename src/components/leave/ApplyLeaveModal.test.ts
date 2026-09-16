import { describe, expect, it } from 'vitest';
import { calculateInclusiveLeaveDays } from './ApplyLeaveModal';

describe('inclusive Leave date calculation', () => {
  it('counts both calendar endpoints', () => {
    expect(calculateInclusiveLeaveDays('2026-09-10', '2026-09-11', 'FULL_DAY')).toBe(2);
    expect(calculateInclusiveLeaveDays('2026-09-10', '2026-09-13', 'FULL_DAY')).toBe(4);
  });

  it('keeps half-day duration independent of the date span', () => {
    expect(calculateInclusiveLeaveDays('2026-09-10', '2026-09-10', 'HALF_DAY_FIRST')).toBe(0.5);
    expect(calculateInclusiveLeaveDays('2026-09-11', '2026-09-11', 'HALF_DAY_SECOND')).toBe(0.5);
  });
});
