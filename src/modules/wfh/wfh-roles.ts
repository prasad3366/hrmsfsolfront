export const WFH_ROLES = ['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER', 'EMPLOYEE'] as const;
export const WFH_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER'] as const;

export const canAccessWfh = (role: string | null | undefined): boolean =>
  typeof role === 'string' && WFH_ROLES.includes(role as typeof WFH_ROLES[number]);

export const canManageWfh = (role: string | null | undefined): boolean =>
  typeof role === 'string' && WFH_MANAGEMENT_ROLES.includes(role as typeof WFH_MANAGEMENT_ROLES[number]);