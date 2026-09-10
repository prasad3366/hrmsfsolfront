import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, Building2, CalendarDays, Check, ChevronRight, Clock3, Cog, FileCheck2,
  FileText, GitBranch, History, KeyRound, Layers3, Loader2, Mail, Plus, Save,
  ShieldCheck, Trash2, Users, Workflow,
} from 'lucide-react';
import settingsApi, {
  AttendancePolicy, AuditLog, EmployeeSettings, Holiday, LeavePolicy, NotificationSettings,
  SecurityPolicy, SettingsPayload, SettingsPermissionResponse, Workflow as WorkflowRecord,
} from '../services/settingsApi';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '../components/ui/components';

type SectionId = 'organization' | 'users' | 'departments' | 'attendance' | 'leave' | 'holidays' | 'lifecycle' | 'notifications' | 'email' | 'security' | 'workflows' | 'documents' | 'audit' | 'preferences';
type PermissionRight = 'read' | 'write' | 'delete';

const ADMIN_ROLES = ['SUPER_ADMIN', 'Super_admin', 'CEO', 'HR'];
const sections: { id: SectionId; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'organization', label: 'Organization', description: 'Company details, headquarters, branches', icon: Building2 },
  { id: 'users', label: 'Users & Roles', description: 'Status and granular RBAC', icon: Users },
  { id: 'departments', label: 'Departments & Teams', description: 'Structure and designations', icon: Layers3 },
  { id: 'attendance', label: 'Attendance Policy', description: 'Shifts, overtime, auto-checkout', icon: Clock3 },
  { id: 'leave', label: 'Leave Policy', description: 'Allocations, carry-forward, LOP', icon: FileCheck2 },
  { id: 'holidays', label: 'Holidays', description: 'Branches and public holidays', icon: CalendarDays },
  { id: 'lifecycle', label: 'Employee Lifecycle', description: 'IDs, probation, notice periods', icon: GitBranch },
  { id: 'notifications', label: 'Notifications', description: 'Email and in-app triggers', icon: Bell },
  { id: 'email', label: 'Email Setup', description: 'SMTP and email templates', icon: Mail },
  { id: 'security', label: 'Security', description: 'Passwords, sessions, 2FA', icon: KeyRound },
  { id: 'workflows', label: 'Approval Workflows', description: 'Leave and attendance rules', icon: Workflow },
  { id: 'documents', label: 'Document Setup', description: 'Onboarding documents and limits', icon: FileText },
  { id: 'audit', label: 'Audit Logs', description: 'History of administrative changes', icon: History },
  { id: 'preferences', label: 'System Preferences', description: 'Dates, currency, timezone', icon: Cog },
];
const modules = ['Recruitment', 'Training', 'Announcements', 'Reports', 'Payroll'];
const roles = ['HR', 'Finance', 'Manager', 'Employee'];
const safeArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const buildDefaultPermissions = (): SettingsPermissionResponse[] => modules.flatMap((module) => roles.map((role) => ({
  module,
  role,
  read: role !== 'Employee',
  write: role === 'HR',
  delete: false,
})));
const getError = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
const inputClass = 'mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

const Field = ({ label, value, onChange, type = 'text', placeholder, disabled = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; disabled?: boolean }) => <label className="block text-sm font-medium text-slate-700">{label}<Input className={inputClass} type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></label>;
const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => <label className="block text-sm font-medium text-slate-700">{label}<select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
const TextAreaField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) => <label className="block text-sm font-medium text-slate-700">{label}<textarea className={`${inputClass} min-h-24`} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
const Toggle = ({ checked, disabled, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: () => void }) => <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-200'} disabled:opacity-50`}><span className={`h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button>;
const ToggleRow = ({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled: boolean; onChange: () => void }) => <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0"><div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div><Toggle checked={checked} disabled={disabled} label={label} onChange={onChange} /></div>;

const SettingsPage = () => {
  const { user } = useAuth();
  const canWrite = Boolean(user && ADMIN_ROLES.includes(user.role));
  const [active, setActive] = useState<SectionId>('organization');
  const [organization, setOrganization] = useState<SettingsPayload>({ companyName: 'FooDeeZ', supportEmail: '', address: '', headquarters: '', branches: '' });
  const [permissions, setPermissions] = useState<SettingsPermissionResponse[]>([]);
  const [attendance, setAttendance] = useState<AttendancePolicy>({ shiftStart: '09:00', shiftEnd: '18:00', gracePeriod: 15, overtimeEnabled: false, autoCheckout: false });
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [lifecycle, setLifecycle] = useState<EmployeeSettings>({ idPrefix: 'EMP', probationPeriod: 90, noticePeriod: 30 });
  const [notifications, setNotifications] = useState<NotificationSettings>({ notifyLeaveApproval: true, notifyAttendanceException: true, notifyAnnouncements: true, emailEnabled: true });
  const [security, setSecurity] = useState<SecurityPolicy>({ minPasswordLength: 8, sessionTimeout: 30, enable2FA: false, requireSpecialCharacter: true });
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [preferences, setPreferences] = useState<SettingsPayload>({ dateFormat: 'DD/MM/YYYY', currencyCode: 'INR', timezone: 'Asia/Kolkata' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchPermissions = async () => {
    try {
      const res = await settingsApi.getRolePermissions();
      if (res && !Array.isArray(res) && Array.isArray(res.data)) {
        setPermissions(res.data);
      } else if (Array.isArray(res)) {
        setPermissions(res);
      } else {
        setPermissions([]);
      }
      setError('');
    } catch (err) {
      console.warn('Permissions API error, using safe fallback array:', err);
      setPermissions([]);
      setError('');
    }
  };

  useEffect(() => {
    void fetchPermissions();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [org, attendanceResult, leave, holidayResult, employee, securityResult, workflowResult, notificationResult, audit] = await Promise.allSettled([
          settingsApi.getOrganizationSettings(), settingsApi.getAttendancePolicy(), settingsApi.getLeavePolicies(), settingsApi.getHolidays(), settingsApi.getEmployeeSettings(), settingsApi.getSecurityPolicy(), settingsApi.getWorkflows(), settingsApi.getNotificationSettings(), settingsApi.getAuditLogs(),
        ]);
        if (org.status === 'fulfilled') setOrganization((current) => ({ ...current, ...(org.value || {}) }));
        if (attendanceResult.status === 'fulfilled') setAttendance((current) => ({ ...current, ...(attendanceResult.value || {}) }));
        if (leave.status === 'fulfilled') setLeavePolicies(safeArray<LeavePolicy>(leave.value));
        if (holidayResult.status === 'fulfilled') setHolidays(safeArray<Holiday>(holidayResult.value));
        if (employee.status === 'fulfilled') setLifecycle((current) => ({ ...current, ...(employee.value || {}) }));
        if (securityResult.status === 'fulfilled') setSecurity((current) => ({ ...current, ...(securityResult.value || {}) }));
        if (workflowResult.status === 'fulfilled') setWorkflows(safeArray<WorkflowRecord>(workflowResult.value));
        if (notificationResult.status === 'fulfilled') setNotifications((current) => ({ ...current, ...(notificationResult.value || {}) }));
        if (audit.status === 'fulfilled') setAuditLogs(safeArray<AuditLog>(audit.value));
      } catch (err) { setError(getError(err, 'Unable to load settings')); } finally { setLoading(false); }
    };
    void load();
  }, []);

  const save = async (action: () => Promise<unknown>, message = 'Settings saved successfully.') => {
    if (!canWrite) return;
    setSaving(true); setError(''); setToast('');
    try { await action(); setToast(message); } catch (err) { setError(getError(err, 'Unable to save settings')); } finally { setSaving(false); }
  };
  const update = <T extends SettingsPayload>(setter: React.Dispatch<React.SetStateAction<T>>, key: string, value: unknown) => setter((current) => ({ ...current, [key]: value } as T));
  const permissionFor = (module: string, role: string) => permissions.find((item) => String(item.module).toLowerCase() === module.toLowerCase() && String(item.role).toLowerCase() === role.toLowerCase()) || { module, role, read: false, write: false, delete: false };
  const togglePermission = async (module: string, role: string, right: PermissionRight) => {
    const roleName = String(role);
    const moduleName = String(module);
    const current = permissionFor(moduleName, roleName);
    const next = { ...current, roleName, moduleName, [right]: !Boolean(current[right]) };
    const key = `${moduleName}:${roleName}:${right}`;
    setPermissions((items) => items.some((item) => item.module === module && item.role === role) ? items.map((item) => item.module === module && item.role === role ? next : item) : [...items, next]); setBusy(key);
    try { await settingsApi.updateRolePermission(next); setError(''); setToast('Permission updated.'); } catch (err) { setPermissions((items) => items.map((item) => item.module === module && item.role === role ? current : item)); setError(getError(err, 'Unable to update permission')); } finally { setBusy(''); }
  };
  const changeSection = (section: SectionId) => { setActive(section); setError(''); setToast(''); };
  const addLeave = () => setLeavePolicies((items) => [...items, { id: `new-${Date.now()}`, name: 'New leave type', days: 0, carryForward: false, lop: false }]);
  const addHoliday = () => setHolidays((items) => [...items, { id: `new-${Date.now()}`, name: 'New holiday', date: new Date().toISOString().slice(0, 10), branch: 'All' }]);
  const deleteLeave = async (policy: LeavePolicy) => { setLeavePolicies((items) => items.filter((item) => item !== policy)); if (typeof policy.id === 'number') await settingsApi.deleteLeavePolicy(policy.id).catch(() => undefined); };
  const deleteHoliday = async (holiday: Holiday) => { setHolidays((items) => items.filter((item) => item !== holiday)); if (typeof holiday.id === 'number') await settingsApi.deleteHoliday(holiday.id).catch(() => undefined); };
  const activeSection = sections.find((section) => section.id === active) || sections[0];
  const auditRows = useMemo(() => safeArray<AuditLog>(auditLogs), [auditLogs]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings console...</div>;
  const saveButton = (action: () => Promise<unknown>, label = 'Save Settings') => canWrite ? <div className="flex justify-end border-t border-slate-100 pt-5"><Button type="button" onClick={() => void save(action)} disabled={saving}><Save size={15} className="mr-2" />{saving ? 'Saving...' : label}</Button></div> : null;

  const renderContent = () => {
    if (active === 'organization') return <Panel title="Organization" description="Company details, headquarters, and operating branches."><div className="grid gap-5 md:grid-cols-2"><Field label="Company Name" value={String(organization.companyName || 'FooDeeZ')} disabled={!canWrite} onChange={(value) => update(setOrganization, 'companyName', value)} /><Field label="Support / HR Email" value={String(organization.supportEmail || '')} disabled={!canWrite} onChange={(value) => update(setOrganization, 'supportEmail', value)} /><TextAreaField label="Registered Address" value={String(organization.address || '')} onChange={(value) => update(setOrganization, 'address', value)} /><TextAreaField label="Headquarters" value={String(organization.headquarters || '')} onChange={(value) => update(setOrganization, 'headquarters', value)} /><TextAreaField label="Branches" value={String(organization.branches || '')} onChange={(value) => update(setOrganization, 'branches', value)} /></div>{saveButton(() => settingsApi.updateOrganizationSettings(organization))}</Panel>;
    if (active === 'users') return <Panel title="Users & Roles" description="Manage granular access rights across core HRMS modules."><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Module</th>{roles.map((role) => <th key={role} className="px-4 py-3">{role}<div className="normal-case font-normal">Read · Write · Delete</div></th>)}</tr></thead><tbody>{modules.map((module) => <tr key={module} className="border-t border-slate-100"><td className="px-4 py-4 font-semibold">{module}</td>{roles.map((role) => { const permission = permissionFor(module, role); return <td key={role} className="px-4 py-4"><div className="flex gap-2">{(['read', 'write', 'delete'] as PermissionRight[]).map((right) => <Toggle key={right} checked={Boolean(permission[right])} disabled={!canWrite || busy !== ''} label={`${role} ${module} ${right}`} onChange={() => void togglePermission(module, role, right)} />)}</div></td>; })}</tr>)}</tbody></table></div></Panel>;
    if (active === 'departments') return <Panel title="Departments & Teams" description="Keep organizational structure and designations aligned with HR operations."><div className="grid gap-5 md:grid-cols-2"><TextAreaField label="Departments" value={String(organization.departments || '')} onChange={(value) => update(setOrganization, 'departments', value)} /><TextAreaField label="Designations" value={String(organization.designations || '')} onChange={(value) => update(setOrganization, 'designations', value)} /></div>{saveButton(() => settingsApi.updateOrganizationSettings(organization))}</Panel>;
    if (active === 'attendance') return <Panel title="Attendance Policy" description="Define shift timings, grace periods, overtime, and automatic checkout behavior."><div className="grid gap-5 md:grid-cols-2"><Field label="Shift Start" type="time" value={String(attendance.shiftStart || '09:00')} onChange={(value) => update(setAttendance, 'shiftStart', value)} /><Field label="Shift End" type="time" value={String(attendance.shiftEnd || '18:00')} onChange={(value) => update(setAttendance, 'shiftEnd', value)} /><Field label="Grace Period (minutes)" type="number" value={Number(attendance.gracePeriod ?? 15)} onChange={(value) => update(setAttendance, 'gracePeriod', Number(value))} /><Field label="Overtime Rate" type="number" value={Number(attendance.overtimeRate ?? 1)} onChange={(value) => update(setAttendance, 'overtimeRate', Number(value))} /></div><div className="mt-6"><ToggleRow label="Enable overtime tracking" description="Calculate overtime after scheduled shift hours." checked={Boolean(attendance.overtimeEnabled)} disabled={!canWrite} onChange={() => update(setAttendance, 'overtimeEnabled', !attendance.overtimeEnabled)} /><ToggleRow label="Automatic checkout" description="Close open attendance records at the end of the configured shift." checked={Boolean(attendance.autoCheckout)} disabled={!canWrite} onChange={() => update(setAttendance, 'autoCheckout', !attendance.autoCheckout)} /></div>{saveButton(() => settingsApi.updateAttendancePolicy(attendance))}</Panel>;
    if (active === 'leave') return <Panel title="Leave Policy" description="Configure leave types, annual allocations, carry-forward, and loss-of-pay rules."><div className="mb-4 flex justify-end"><Button size="sm" variant="outline" onClick={addLeave} disabled={!canWrite}><Plus size={14} className="mr-1" />Add Leave Type</Button></div><div className="space-y-3">{safeArray<LeavePolicy>(leavePolicies).map((policy, index) => <div key={String(policy.id || index)} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_120px_130px_130px_auto] md:items-end"><Field label="Leave type" value={String(policy.name || policy.type || '')} onChange={(value) => setLeavePolicies((items) => items.map((item) => item === policy ? { ...item, name: value } : item))} /><Field label="Annual days" type="number" value={Number(policy.days ?? policy.annualAllocation ?? 0)} onChange={(value) => setLeavePolicies((items) => items.map((item) => item === policy ? { ...item, days: Number(value) } : item))} /><label className="text-sm font-medium text-slate-700">Carry forward<div className="mt-3"><Toggle checked={Boolean(policy.carryForward)} disabled={!canWrite} label="Carry forward" onChange={() => setLeavePolicies((items) => items.map((item) => item === policy ? { ...item, carryForward: !item.carryForward } : item))} /></div></label><label className="text-sm font-medium text-slate-700">LOP enabled<div className="mt-3"><Toggle checked={Boolean(policy.lop)} disabled={!canWrite} label="LOP enabled" onChange={() => setLeavePolicies((items) => items.map((item) => item === policy ? { ...item, lop: !item.lop } : item))} /></div></label><button type="button" title="Delete leave type" aria-label="Delete leave type" disabled={!canWrite} onClick={() => void deleteLeave(policy)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={17} /></button></div>)}</div>{saveButton(() => Promise.all(safeArray<LeavePolicy>(leavePolicies).map((policy) => settingsApi.upsertLeavePolicy(policy))), 'Save Leave Policies')}</Panel>;
    if (active === 'holidays') return <Panel title="Holidays" description="Set up branch-specific and public holiday calendars."><div className="mb-4 flex justify-end"><Button size="sm" variant="outline" onClick={addHoliday} disabled={!canWrite}><Plus size={14} className="mr-1" />Add Holiday</Button></div><div className="space-y-3">{safeArray<Holiday>(holidays).map((holiday, index) => <div key={String(holiday.id || index)} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"><Field label="Holiday name" value={String(holiday.name || '')} onChange={(value) => setHolidays((items) => items.map((item) => item === holiday ? { ...item, name: value } : item))} /><Field label="Date" type="date" value={String(holiday.date || '')} onChange={(value) => setHolidays((items) => items.map((item) => item === holiday ? { ...item, date: value } : item))} /><Field label="Branch" value={String(holiday.branch || 'All')} onChange={(value) => setHolidays((items) => items.map((item) => item === holiday ? { ...item, branch: value } : item))} /><button type="button" title="Delete holiday" aria-label="Delete holiday" disabled={!canWrite} onClick={() => void deleteHoliday(holiday)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={17} /></button></div>)}</div>{saveButton(() => Promise.all(safeArray<Holiday>(holidays).filter((holiday) => typeof holiday.id !== 'number').map((holiday) => settingsApi.createHoliday(holiday))), 'Save Holidays')}</Panel>;
    if (active === 'lifecycle') return <Panel title="Employee Lifecycle" description="Standardize employee IDs, probation, and notice periods."><div className="grid gap-5 md:grid-cols-3"><Field label="Employee ID Prefix" value={String(lifecycle.idPrefix || 'EMP')} onChange={(value) => update(setLifecycle, 'idPrefix', value)} /><Field label="Probation (days)" type="number" value={Number(lifecycle.probationPeriod ?? 90)} onChange={(value) => update(setLifecycle, 'probationPeriod', Number(value))} /><Field label="Notice Period (days)" type="number" value={Number(lifecycle.noticePeriod ?? 30)} onChange={(value) => update(setLifecycle, 'noticePeriod', Number(value))} /></div>{saveButton(() => settingsApi.updateEmployeeSettings(lifecycle))}</Panel>;
    if (active === 'notifications') return <Panel title="Notifications" description="Choose which operational events send email and in-app alerts."><ToggleRow label="Leave approval notifications" description="Notify employees when leave requests are approved or rejected." checked={Boolean(notifications.notifyLeaveApproval)} disabled={!canWrite} onChange={() => update(setNotifications, 'notifyLeaveApproval', !notifications.notifyLeaveApproval)} /><ToggleRow label="Attendance exception alerts" description="Notify managers about missed punches and attendance exceptions." checked={Boolean(notifications.notifyAttendanceException)} disabled={!canWrite} onChange={() => update(setNotifications, 'notifyAttendanceException', !notifications.notifyAttendanceException)} /><ToggleRow label="Announcement notifications" description="Send new company broadcasts to targeted employees." checked={Boolean(notifications.notifyAnnouncements)} disabled={!canWrite} onChange={() => update(setNotifications, 'notifyAnnouncements', !notifications.notifyAnnouncements)} /><ToggleRow label="Email delivery enabled" description="Allow the portal to deliver configured HRMS email notifications." checked={Boolean(notifications.emailEnabled)} disabled={!canWrite} onChange={() => update(setNotifications, 'emailEnabled', !notifications.emailEnabled)} />{saveButton(() => settingsApi.updateNotificationSettings(notifications))}</Panel>;
    if (active === 'email') return <Panel title="Email Setup" description="Configure SMTP delivery and reusable email templates."><div className="grid gap-5 md:grid-cols-2"><Field label="SMTP Host" value={String(organization.smtpHost || '')} onChange={(value) => update(setOrganization, 'smtpHost', value)} /><Field label="SMTP Port" type="number" value={Number(organization.smtpPort ?? 587)} onChange={(value) => update(setOrganization, 'smtpPort', Number(value))} /><Field label="SMTP Username" value={String(organization.smtpUsername || '')} onChange={(value) => update(setOrganization, 'smtpUsername', value)} /><Field label="SMTP Password" type="password" value={String(organization.smtpPassword || '')} onChange={(value) => update(setOrganization, 'smtpPassword', value)} /><TextAreaField label="Welcome Email Template" value={String(organization.welcomeEmailTemplate || '')} onChange={(value) => update(setOrganization, 'welcomeEmailTemplate', value)} placeholder="Use {{employeeName}} for dynamic values" /><TextAreaField label="Leave Approval Template" value={String(organization.leaveEmailTemplate || '')} onChange={(value) => update(setOrganization, 'leaveEmailTemplate', value)} /></div>{saveButton(() => settingsApi.updateOrganizationSettings(organization))}</Panel>;
    if (active === 'security') return <Panel title="Security" description="Set password requirements, session security, and two-factor authentication."><div className="grid gap-5 md:grid-cols-2"><Field label="Minimum password length" type="number" value={Number(security.minPasswordLength ?? 8)} onChange={(value) => update(setSecurity, 'minPasswordLength', Number(value))} /><Field label="Session timeout (minutes)" type="number" value={Number(security.sessionTimeout ?? 30)} onChange={(value) => update(setSecurity, 'sessionTimeout', Number(value))} /></div><div className="mt-6"><ToggleRow label="Require special character" description="Require a symbol in all new passwords." checked={Boolean(security.requireSpecialCharacter)} disabled={!canWrite} onChange={() => update(setSecurity, 'requireSpecialCharacter', !security.requireSpecialCharacter)} /><ToggleRow label="Enable two-factor authentication" description="Require an additional verification step for administrative accounts." checked={Boolean(security.enable2FA)} disabled={!canWrite} onChange={() => update(setSecurity, 'enable2FA', !security.enable2FA)} /></div>{saveButton(() => settingsApi.updateSecurityPolicy(security))}</Panel>;
    if (active === 'workflows') return <Panel title="Approval Workflows" description="Manage multi-level approval rules for leave and attendance. "><div className="space-y-3">{safeArray<WorkflowRecord>(workflows).map((workflow, index) => <div key={String(workflow.id || index)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-800">{String(workflow.name || workflow.type || 'Approval workflow')}</p><p className="mt-1 text-xs text-slate-500">{String(workflow.description || 'Configure approvers and escalation rules.')}</p></div><Toggle checked={Boolean(workflow.enabled ?? true)} disabled={!canWrite} label="Enable workflow" onChange={() => { const next = { ...workflow, enabled: !Boolean(workflow.enabled ?? true) }; setWorkflows((items) => items.map((item) => item === workflow ? next : item)); void settingsApi.updateWorkflow(next).catch(() => setError('Unable to update workflow')); }} /></div>)}</div>{!workflows.length && <EmptyState text="No approval workflows configured." />}</Panel>;
    if (active === 'documents') return <Panel title="Document Setup" description="Define required onboarding documents and upload limits."><div className="grid gap-5 md:grid-cols-2"><TextAreaField label="Required documents" value={String(organization.requiredDocuments || '')} onChange={(value) => update(setOrganization, 'requiredDocuments', value)} placeholder="Identity proof\nAddress proof\nSigned offer letter" /><Field label="Maximum file size (MB)" type="number" value={Number(organization.maxFileSizeMb ?? 10)} onChange={(value) => update(setOrganization, 'maxFileSizeMb', Number(value))} /></div>{saveButton(() => settingsApi.updateOrganizationSettings(organization))}</Panel>;
    if (active === 'audit') return <Panel title="Audit Logs" description="Review administrative actions across the portal."><div className="mb-4 grid gap-3 md:grid-cols-3"><Input placeholder="Filter action" /><Input placeholder="Filter user" type="search" /><Button variant="outline" onClick={() => void settingsApi.getAuditLogs().then((data) => setAuditLogs(safeArray<AuditLog>(data)))}><History size={15} className="mr-2" />Refresh logs</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Action', 'User', 'Module', 'Diff', 'IP', 'Timestamp'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody>{auditRows.map((log, index) => <tr key={String(log.id || index)} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{String(log.action || '-')}</td><td className="px-4 py-3">{String(log.user || log.userName || '-')}</td><td className="px-4 py-3">{String(log.module || '-')}</td><td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{String(log.diff || '-')}</td><td className="px-4 py-3">{String(log.ip || '-')}</td><td className="px-4 py-3 text-xs text-slate-500">{String(log.timestamp || log.createdAt || '-')}</td></tr>)}</tbody></table></div>{!auditRows.length && <EmptyState text="No audit log entries found." />}</Panel>;
    return <Panel title="System Preferences" description="Set portal-wide date, currency, and timezone defaults."><div className="grid gap-5 md:grid-cols-3"><SelectField label="Date format" value={String(preferences.dateFormat || 'DD/MM/YYYY')} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} onChange={(value) => update(setPreferences, 'dateFormat', value)} /><SelectField label="Currency" value={String(preferences.currencyCode || 'INR')} options={['INR', 'USD', 'EUR', 'GBP', 'SGD']} onChange={(value) => update(setPreferences, 'currencyCode', value)} /><SelectField label="Default timezone" value={String(preferences.timezone || 'Asia/Kolkata')} options={['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London']} onChange={(value) => update(setPreferences, 'timezone', value)} /></div>{saveButton(() => settingsApi.updateOrganizationSettings(preferences))}</Panel>;
  };

  return <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8"><div><div className="mb-2 flex items-center gap-2 text-blue-600"><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-widest">Administration console</span></div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1><p className="mt-1 text-sm text-slate-500">Configure the policies, controls, and operational defaults for FooDeeZ HRMS.</p></div>{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{toast && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check size={16} />{toast}</p>}<div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]"><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-24"><div className="px-3 py-3"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Settings areas</p><p className="mt-1 text-xs text-slate-500">{canWrite ? 'Administrative access enabled' : 'Read-only access'}</p></div><nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">{sections.map((section) => { const Icon = section.icon; return <button type="button" key={section.id} onClick={() => changeSection(section.id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active === section.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={17} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{section.label}</span><span className="hidden truncate text-[11px] text-slate-400 lg:block">{section.description}</span></span><ChevronRight size={14} className={active === section.id ? 'text-blue-500' : 'text-slate-300'} /></button>; })}</nav></aside><main className="min-w-0">{canWrite ? renderContent() : <fieldset disabled className="min-w-0 opacity-90">{renderContent()}</fieldset>}</main></div><p className="text-xs text-slate-400">Active section: {activeSection.label}</p></div>;
};

const Panel = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => <Card><CardHeader className="border-b border-slate-100"><CardTitle className="text-lg">{title}</CardTitle><p className="mt-1 text-sm font-normal text-slate-500">{description}</p></CardHeader><CardContent className="p-5 md:p-6">{children}</CardContent></Card>;
const EmptyState = ({ text }: { text: string }) => <p className="py-10 text-center text-sm text-slate-500">{text}</p>;

export default SettingsPage;
