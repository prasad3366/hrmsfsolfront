import { Role } from '../../types';

export const HOLIDAY_MANAGEMENT_ROLES: Role[] = ['SUPER_ADMIN', 'CEO', 'HR'];

export const canManageHolidays = (role: Role): boolean =>
  HOLIDAY_MANAGEMENT_ROLES.includes(role);