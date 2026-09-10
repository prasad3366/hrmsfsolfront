import { describe, expect, it } from 'vitest';
import { canAccessWfh, canManageWfh } from './wfh-roles';

describe('WFH role access', () => {
  it.each(['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER', 'EMPLOYEE'])('allows %s', (role) => {
    expect(canAccessWfh(role)).toBe(true);
  });

  it.each(['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER'])('allows management UI for %s', (role) => {
    expect(canManageWfh(role)).toBe(true);
  });

  it.each(['FINANCE_MANAGER', 'ADMIN', 'MANAGER', 'UNKNOWN', '', null, undefined])('fails closed for %s', (role) => {
    expect(canAccessWfh(role)).toBe(false);
    expect(canManageWfh(role)).toBe(false);
  });
});