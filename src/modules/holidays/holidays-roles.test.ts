import { describe, expect, it } from 'vitest';
import { canManageHolidays, HOLIDAY_MANAGEMENT_ROLES } from './holidays-roles';

describe('holiday access roles', () => {
  it('allows only approved management roles to manage holidays', () => {
    expect(HOLIDAY_MANAGEMENT_ROLES).toEqual(['SUPER_ADMIN', 'CEO', 'HR']);
    expect(HOLIDAY_MANAGEMENT_ROLES.every(canManageHolidays)).toBe(true);
    expect(canManageHolidays('EMPLOYEE')).toBe(false);
    expect(canManageHolidays('FINANCE_MANAGER')).toBe(false);
  });
});