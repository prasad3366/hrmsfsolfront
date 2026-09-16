import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  Edit3,
  Megaphone,
  Pin,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  CreateAnnouncementDto,
} from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '../components/ui/components';

const MANAGEMENT_ROLES = ['SUPER_ADMIN', 'CEO', 'HR'];
const MANAGER_ROLES = ['IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER'];
const DEPARTMENTS = ['All', 'HR', 'IT', 'Finance', 'Sales', 'Operations', 'Marketing'];
const categories: { value: AnnouncementCategory; label: string }[] = [
  { value: 'POLICY', label: 'Policy' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'GENERAL', label: 'General' },
  { value: 'EVENT', label: 'Event' },
];
const priorities: AnnouncementPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

type Filter = 'all' | 'pinned' | 'unread' | 'department';

const emptyForm: CreateAnnouncementDto = {
  title: '',
  content: '',
  category: 'GENERAL',
  priority: 'MEDIUM',
  targetAudience: 'ALL',
  isPinned: false,
  expiresAt: '',
};

const getError = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
const isRead = (announcement: Announcement) => Boolean(announcement.isRead ?? announcement.read);
const isGlobalAnnouncement = (announcement: Announcement) => {
  const target = String(announcement.targetDepartment || '').toUpperCase();
  return !target || target === 'ALL';
};
const formatDate = (date?: string | null) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No expiry';

const priorityStyles: Record<AnnouncementPriority, { badge: string; border: string }> = {
  URGENT: { badge: 'bg-[#fff1ef] text-[#a63e35] border border-[#f3c9c3]', border: 'border-l-[#c85d51]' },
  HIGH: { badge: 'bg-[#fff7e7] text-[#8b641b] border border-[#f0ddb1]', border: 'border-l-[#b08a3e]' },
  MEDIUM: { badge: 'bg-[#eaf3f7] text-[#1e627d] border border-[#cce1e8]', border: 'border-l-[#1e627d]' },
  LOW: { badge: 'bg-[#edf3f5] text-[#486271] border border-[#d5e1e3]', border: 'border-l-[#78909a]' },
};

const AnnouncementModal = ({
  announcement,
  onClose,
  onSubmit,
  busy,
  userRole,
  userDepartment,
  teams,
}: {
  announcement?: Announcement;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementDto) => Promise<void>;
  busy: boolean;
  userRole: string;
  userDepartment: string;
  teams: { id: number; name: string }[];
}) => {
  const canChooseAudience = MANAGEMENT_ROLES.includes(userRole);
  const isManager = MANAGER_ROLES.includes(userRole);
  const managerDepartment = userDepartment && userDepartment !== 'General' ? userDepartment : 'General';
  const [form, setForm] = useState<CreateAnnouncementDto>(() => announcement ? {
    title: announcement.title || '',
    content: announcement.content || '',
    category: announcement.category || 'GENERAL',
    priority: announcement.priority || 'MEDIUM',
    targetAudience: announcement.targetAudience || (announcement.targetDepartment ? 'DEPARTMENT' : 'ALL'),
    departmentId: announcement.departmentId || (announcement.targetDepartment && announcement.targetDepartment !== 'ALL' ? announcement.targetDepartment : undefined),
    teamId: announcement.teamId ?? undefined,
    isPinned: Boolean(announcement.isPinned),
    expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 10) : '',
  } : emptyForm);
  const [error, setError] = useState('');
  const update = <K extends keyof CreateAnnouncementDto>(key: K, value: CreateAnnouncementDto[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        targetAudience: isManager ? 'TEAM' : form.targetAudience,
        departmentId: isManager ? undefined : form.targetAudience === 'DEPARTMENT' ? (form.departmentId || managerDepartment) : undefined,
        teamId: isManager ? undefined : form.targetAudience === 'TEAM' ? form.teamId : undefined,
      });
      onClose();
    } catch (err) {
      setError(getError(err, 'Unable to save announcement'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#022337]/45 p-4 backdrop-blur-[2px]" role="presentation">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#d5e1e3] bg-[#fffefa] shadow-[0_24px_80px_rgba(2,35,55,0.24)]" role="dialog" aria-modal="true" aria-labelledby="announcement-dialog-title">
        <div className="flex items-center justify-between border-b border-[#dce6e8] bg-[#f6faf9]/70 px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-[#b08a3e]">Company broadcast</p><h2 id="announcement-dialog-title" className="mt-1 text-xl font-bold text-[#073b5c]">{announcement ? 'Edit announcement' : 'Post announcement'}</h2></div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          {error && <p role="alert" className="rounded-lg border border-[#f3c9c3] bg-[#fff1ef] px-3 py-2 text-sm text-[#a63e35]">{error}</p>}
          <label className="block text-sm font-medium text-slate-700">Title *<Input className="mt-2" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Write a clear headline" /></label>
          <label className="block text-sm font-medium text-slate-700">Content *<textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows={5} placeholder="Share the details with your colleagues" className="mt-2 w-full rounded-xl border border-[#cbd9dc] px-3 py-2 text-sm text-[#12354a] outline-none transition focus:border-[#b08a3e] focus:ring-2 focus:ring-[#b08a3e]/20" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Category<select value={form.category} onChange={(event) => update('category', event.target.value as AnnouncementCategory)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="POLICY">Policy</option><option value="HOLIDAY">Holiday</option><option value="GENERAL">General</option><option value="EVENT">Event</option></select></label>
            <label className="text-sm font-medium text-slate-700">Priority<select value={form.priority} onChange={(event) => update('priority', event.target.value as AnnouncementPriority)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Audience Scope
              {canChooseAudience ? (
                <>
                  <select value={form.targetAudience} onChange={(event) => update('targetAudience', event.target.value as CreateAnnouncementDto['targetAudience'])} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                    <option value="ALL">All Employees (Global)</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="TEAM">Team</option>
                  </select>
                  {form.targetAudience === 'DEPARTMENT' && <select value={form.departmentId || managerDepartment} onChange={(event) => update('departmentId', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{DEPARTMENTS.filter((department) => department !== 'All').map((department) => <option key={department} value={department}>{department}</option>)}</select>}
                  {form.targetAudience === 'TEAM' && <select value={form.teamId || ''} onChange={(event) => update('teamId', Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Select a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>}
                </>
              ) : (
                <input value={`Target: ${isManager ? managerDepartment : 'My Department Only'}`} readOnly className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600" />
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">Expiration date<Input className="mt-2" type="date" value={form.expiresAt} onChange={(event) => update('expiresAt', event.target.value)} /></label>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isPinned} onChange={(event) => update('isPinned', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#b08a3e] focus:ring-[#b08a3e]" />Pin this announcement for visibility</label>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving...' : announcement ? 'Save changes' : 'Post announcement'}</Button></div>
        </form>
      </div>
    </div>
  );
};

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const canManage = Boolean(user && (MANAGEMENT_ROLES.includes(user.role) || MANAGER_ROLES.includes(user.role)));
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<Announcement>();
  const [modalOpen, setModalOpen] = useState(false);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getError(err, 'Unable to load announcements'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchAnnouncements(); }, []);
  useEffect(() => {
    if (!user || !MANAGEMENT_ROLES.includes(user.role)) return;
    void api.getAllTeams().then((result) => setTeams(Array.isArray(result) ? result : [])).catch(() => setTeams([]));
  }, [user]);

  const filteredAnnouncements = useMemo(() => {
    return (announcements || []).filter((announcement) => {
      if (filter === 'pinned') return Boolean(announcement.isPinned);
      if (filter === 'unread') return !isRead(announcement);
      if (filter === 'department') return !isGlobalAnnouncement(announcement);
      return true;
    });
  }, [announcements, filter]);

  const saveAnnouncement = async (data: CreateAnnouncementDto) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      if (editing) {
        const saved = await api.updateAnnouncement(editing.id, data);
        setAnnouncements((current) => current.map((item) => item.id === saved.id ? saved : item));
        setSuccess('Announcement updated successfully.');
      } else {
        const saved = await api.createAnnouncement(data);
        setAnnouncements((current) => [saved, ...current]);
        setSuccess('Announcement posted successfully.');
      }
    } finally {
      setBusy(false);
    }
  };

  const removeAnnouncement = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    setBusy(true); setError('');
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements((current) => current.filter((item) => item.id !== id));
      setSuccess('Announcement deleted.');
    } catch (err) {
      setError(getError(err, 'Unable to delete announcement'));
    } finally {
      setBusy(false);
    }
  };

  const markAsRead = async (announcement: Announcement) => {
    if (isRead(announcement)) return;
    try {
      await api.markAnnouncementAsRead(announcement.id);
      setAnnouncements((current) => current.map((item) => item.id === announcement.id ? { ...item, isRead: true, read: true } : item));
    } catch (err) {
      setError(getError(err, 'Unable to update read status'));
    }
  };

  const markAsUnread = async (announcement: Announcement) => {
    if (!isRead(announcement)) return;
    try {
      await api.markAnnouncementAsUnread(announcement.id);
      setAnnouncements((current) => current.map((item) => item.id === announcement.id ? { ...item, isRead: false, read: false } : item));
    } catch (err) {
      setError(getError(err, 'Unable to update read status'));
    }
  };

  return (
    <div className="announcements-page mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-[#b08a3e]"><Megaphone size={18} /><span className="text-xs font-bold uppercase tracking-widest">FooDeeZ broadcasts</span></div><h1 className="text-3xl font-bold tracking-tight text-[#073b5c]">Announcements</h1><p className="mt-1 text-sm text-[#617984]">Company Broadcasts &amp; Notices</p></div>
        {canManage && <Button onClick={() => { setEditing(undefined); setModalOpen(true); }}><Plus size={16} className="mr-2" />Post Announcement</Button>}
      </div>
      {error && <p role="alert" className="rounded-lg border border-[#f3c9c3] bg-[#fff1ef] px-4 py-3 text-sm text-[#a63e35]">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      <div className="flex flex-col gap-3 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-1 overflow-x-auto">{([['all', 'All Notices'], ['pinned', 'Pinned'], ['unread', 'Unread'], ['department', 'Department Specific']] as [Filter, string][]).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${filter === value ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div><button type="button" onClick={() => void fetchAnnouncements()} className="mb-2 inline-flex items-center gap-2 self-start text-xs font-semibold text-slate-500 hover:text-blue-700 sm:self-auto"><RefreshCw size={14} />Refresh</button></div>
      {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading announcements...</div> : filteredAnnouncements.length === 0 ? <Card><CardContent className="flex flex-col items-center py-16 text-center"><div className="rounded-full bg-blue-50 p-4 text-blue-600"><Bell size={24} /></div><h2 className="mt-4 font-semibold text-slate-900">No announcements here</h2><p className="mt-1 text-sm text-slate-500">New company updates will appear in this feed.</p></CardContent></Card> : <div className="space-y-4">{filteredAnnouncements.map((announcement) => { const priority = priorityStyles[announcement.priority] || priorityStyles.MEDIUM; const read = isRead(announcement); return <Card key={announcement.id} className={`border-l-4 ${priority.border} ${!read ? 'shadow-md' : ''}`}><CardHeader className="flex-row items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge className={priority.badge}>{announcement.priority}</Badge><Badge variant="default">{announcement.category}</Badge>{announcement.isPinned === true && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Pin size={13} fill="currentColor" />Pinned</span>}</div><CardTitle className="text-lg">{announcement.title}</CardTitle><p className="mt-2 text-xs text-slate-400">{announcement.createdAt ? formatDate(announcement.createdAt) : 'Recently posted'}{announcement.author?.name ? ` · ${announcement.author.name}` : ''}</p></div>{canManage && <div className="flex shrink-0 gap-1"><button type="button" aria-label={`Edit ${announcement.title}`} title="Edit announcement" onClick={() => { setEditing(announcement); setModalOpen(true); }} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={16} /></button><button type="button" aria-label={`Delete ${announcement.title}`} title="Delete announcement" onClick={() => void removeAnnouncement(announcement.id)} disabled={busy} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={16} /></button></div>}</CardHeader><CardContent className="pt-2"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.content}</p><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isGlobalAnnouncement(announcement) ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>{isGlobalAnnouncement(announcement) ? 'Global Broadcast' : `${announcement.targetDepartment} Dept`}</span><span className="text-xs text-slate-400">Expires: {formatDate(announcement.expiresAt)}</span></div>{read ? <Button size="sm" variant="outline" onClick={() => void markAsUnread(announcement)}>Mark as Unread</Button> : <Button size="sm" variant="outline" onClick={() => void markAsRead(announcement)}><Check size={14} className="mr-1" />Mark as Read</Button>}</div></CardContent></Card>; })}</div>}
      {modalOpen && <AnnouncementModal announcement={editing} onClose={() => { setModalOpen(false); setEditing(undefined); }} onSubmit={saveAnnouncement} busy={busy} userRole={user?.role || 'EMPLOYEE'} userDepartment={user?.department || 'General'} teams={teams} />}
    </div>
  );
};

export default AnnouncementsPage;
