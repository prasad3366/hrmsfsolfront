import type { Role } from '../../types';

export const REPORTS_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'CEO',
  'HR',
  'FINANCE_MANAGER',
  'IT_MANAGER',
  'SALES_MANAGER',
];

export const canAccessReports = (role: Role | null | undefined): boolean => (
  Boolean(role && REPORTS_ROLES.includes(role))
);