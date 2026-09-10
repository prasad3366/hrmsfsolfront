import { describe, expect, it } from 'vitest';
import { canAccessReports } from './reports-roles';

describe('Reports role access', () => {
  it.each(['SUPER_ADMIN', 'CEO', 'HR'])('allows organization-wide role %s', (role) => {
    expect(canAccessReports(role as never)).toBe(true);
  });

  it.each(['FINANCE_MANAGER', 'IT_MANAGER', 'SALES_MANAGER'])('allows scoped role %s', (role) => {
    expect(canAccessReports(role as never)).toBe(true);
  });

  it.each(['EMPLOYEE', null, undefined, 'ADMIN', 'MANAGER'])('denies role %s', (role) => {
    expect(canAccessReports(role as never)).toBe(false);
  });
});