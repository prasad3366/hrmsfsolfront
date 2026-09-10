import api from './api';

export type SettingsPayload = Record<string, unknown>;
export type SettingsResponse = Record<string, unknown>;
export type SettingsPermission = Record<string, unknown>;
export type SettingsPermissionResponse = Record<string, unknown>;
export type RolePermissionsResponse = SettingsPermissionResponse[] | { data?: SettingsPermissionResponse[] };
export type AttendancePolicy = Record<string, unknown>;
export type LeavePolicy = Record<string, unknown>;
export type Holiday = Record<string, unknown>;
export type EmployeeSettings = Record<string, unknown>;
export type SecurityPolicy = Record<string, unknown>;
export type Workflow = Record<string, unknown>;
export type NotificationSettings = Record<string, unknown>;
export type AuditLog = Record<string, unknown>;
export type AuditLogParams = Record<string, string | number | boolean | null | undefined>;

const buildQuery = (params: AuditLogParams = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export const getOrganizationSettings = () => api.get<SettingsResponse>('/settings/organization');
export const updateOrganizationSettings = (data: SettingsPayload) => api.patch<SettingsResponse>('/settings/organization', data);

export const getRolePermissions = () => api.get<RolePermissionsResponse>('/settings/permissions');
export const updateRolePermission = (data: SettingsPermission) => api.patch<SettingsPermissionResponse>('/settings/permissions', data);

export const getAttendancePolicy = () => api.get<AttendancePolicy>('/settings/attendance');
export const updateAttendancePolicy = (data: SettingsPayload) => api.patch<AttendancePolicy>('/settings/attendance', data);
export const getLeavePolicies = () => api.get<LeavePolicy[]>('/settings/leave');
export const upsertLeavePolicy = (data: SettingsPayload) => api.post<LeavePolicy>('/settings/leave', data);
export const deleteLeavePolicy = (id: number | string) => api.delete<void>(`/settings/leave/${encodeURIComponent(String(id))}`);

export const getHolidays = () => api.get<Holiday[]>('/settings/holidays');
export const createHoliday = (data: SettingsPayload) => api.post<Holiday>('/settings/holidays', data);
export const deleteHoliday = (id: number | string) => api.delete<void>(`/settings/holidays/${encodeURIComponent(String(id))}`);
export const getEmployeeSettings = () => api.get<EmployeeSettings>('/settings/employee-lifecycle');
export const updateEmployeeSettings = (data: SettingsPayload) => api.patch<EmployeeSettings>('/settings/employee-lifecycle', data);

export const getSecurityPolicy = () => api.get<SecurityPolicy>('/settings/security');
export const updateSecurityPolicy = (data: SettingsPayload) => api.patch<SecurityPolicy>('/settings/security', data);
export const getWorkflows = () => api.get<Workflow[]>('/settings/workflows');
export const updateWorkflow = (data: SettingsPayload) => api.patch<Workflow>('/settings/workflows', data);
export const getNotificationSettings = () => api.get<NotificationSettings>('/settings/notifications');
export const updateNotificationSettings = (data: SettingsPayload) => api.patch<NotificationSettings>('/settings/notifications', data);
export const getAuditLogs = (params: AuditLogParams = {}) => api.get<AuditLog[]>(`/settings/audit-logs${buildQuery(params)}`);

const settingsApi = {
  getOrganizationSettings,
  updateOrganizationSettings,
  getRolePermissions,
  updateRolePermission,
  getAttendancePolicy,
  updateAttendancePolicy,
  getLeavePolicies,
  upsertLeavePolicy,
  deleteLeavePolicy,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getEmployeeSettings,
  updateEmployeeSettings,
  getSecurityPolicy,
  updateSecurityPolicy,
  getWorkflows,
  updateWorkflow,
  getNotificationSettings,
  updateNotificationSettings,
  getAuditLogs,
};

export default settingsApi;
