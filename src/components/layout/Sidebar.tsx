import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart2, Briefcase, CalendarCheck, ChevronLeft, ChevronRight, DollarSign,
  File, FileText, GraduationCap, HelpCircle, LayoutDashboard, LogOut,
  Megaphone, Monitor, PanelLeftClose, Settings, TrendingUp, UserCheck, Users,
} from 'lucide-react';
import { Avatar, cn } from '../ui/components';
import { REPORTS_ROLES } from '../../modules/reports/reports-roles';

const foodeezLogo = new URL('../../assets/foodeez.png', import.meta.url).href;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const Sidebar = ({ isOpen, onClose, collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  if (!user) return null;

  const setCollapsed = (nextCollapsed: boolean) => {
    setInternalCollapsed(nextCollapsed);
    onCollapsedChange?.(nextCollapsed);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const employeeAttendanceRoles = ['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER'];
  const assetRoles = ['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER', 'EMPLOYEE'];
  const groups: { label: string; links: NavigationItem[] }[] = [
    { label: 'Overview', links: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
    { label: 'People', links: [
      { name: 'Employees', path: '/employees', icon: Users },
      { name: 'Team', path: '/team', icon: UserCheck },
      { name: 'Recruitment', path: '/recruitment', icon: Briefcase },
    ] },
    { label: 'Time & Leave', links: [
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
      ...(employeeAttendanceRoles.includes(user.role) ? [{ name: 'Employee Attendance', path: '/employee-attendance', icon: CalendarCheck }] : []),
      { name: 'Leave', path: '/leave', icon: FileText },
      { name: 'Holidays', path: '/holidays', icon: CalendarCheck },
    ] },
    { label: 'Finance', links: [{ name: 'Payroll', path: '/payroll', icon: DollarSign }] },
    { label: 'Operations', links: [
      ...(assetRoles.includes(user.role) ? [{ name: 'Assets', path: '/assets', icon: Monitor }] : []),
      { name: 'Documents', path: '/documents', icon: File },
      { name: 'Helpdesk', path: '/helpdesk', icon: HelpCircle },
      { name: 'Training', path: '/training', icon: GraduationCap },
    ] },
    { label: 'Insights', links: [
      { name: 'Announcements', path: '/announcements', icon: Megaphone },
      { name: 'Performance', path: '/performance', icon: TrendingUp },
      ...(REPORTS_ROLES.includes(user.role) ? [{ name: 'Reports', path: '/reports', icon: BarChart2 }] : []),
    ] },
    { label: 'Administration', links: [{ name: 'Settings', path: '/settings', icon: Settings }] },
  ];

  return (
    <>
      {isOpen && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-20 bg-[#022337]/45 backdrop-blur-[2px] lg:hidden" />}
      <aside className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden border-r border-[#c3a25a]/20 bg-[#022337] text-white shadow-[12px_0_40px_rgba(2,35,55,0.2)] transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        collapsed ? 'w-20' : 'w-64', isOpen ? 'translate-x-0' : '-translate-x-full', 'lg:translate-x-0'
      )}>
        <div className={cn('flex h-20 shrink-0 items-center border-b border-white/10 bg-[#073b5c]/40', collapsed ? 'justify-center px-3' : 'px-5')}>
          <img src={foodeezLogo} alt="FooDeeZ" className={cn('w-auto object-contain transition-all duration-300', collapsed ? 'h-11' : 'h-16')} />
        </div>
        <nav aria-label="Primary navigation" className="scrollbar-hide flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8db1bd]">{group.label}</p>}
            {collapsed && <div className="mx-auto mb-2 h-px w-8 bg-white/10" aria-hidden="true" />}
            <div className="space-y-1">
              {group.links.map((link) => <NavLink key={link.name} to={link.path} end={link.path === '/dashboard'} onClick={onClose} title={collapsed ? link.name : undefined} className={({ isActive }) => cn(
                'group relative flex items-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3a25a]',
                collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                isActive ? 'bg-[#0d526b]/70 text-white shadow-[inset_3px_0_0_#c3a25a]' : 'text-[#a9c0c7] hover:bg-white/[0.07] hover:text-white'
              )}>{({ isActive }) => <>
                {isActive && <span className="absolute left-0 h-7 w-0.5 rounded-r-full bg-[#c3a25a] shadow-[0_0_12px_rgba(195,162,90,0.8)]" />}
                <link.icon size={18} className={cn('shrink-0 transition-colors duration-200', isActive ? 'text-[#e3c477]' : 'text-[#7fa5b1] group-hover:text-[#c3a25a]')} />
                {!collapsed && <span className="truncate">{link.name}</span>}
              </>}</NavLink>)}
            </div>
          </div>)}
        </nav>
        <div className={cn('shrink-0 border-t border-white/10 bg-[#073b5c]/45 p-3', collapsed ? 'space-y-2' : '')}>
          <button type="button" onClick={() => { if (!user.employeeId) { alert('Employee ID not found. Please refresh the page.'); return; } navigate(`/employees/${user.employeeId}`); }} title="View your profile" className={cn('group flex w-full items-center rounded-xl p-2 text-left transition-colors duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3a25a]', collapsed ? 'justify-center' : 'gap-3')}>
            <Avatar src={user.avatar} name={user.name} size="sm" className="ring-[#0d526b]" />
            {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-white">{user.name}</span><span className="block truncate text-[11px] capitalize text-[#9db9c1]">{user.role.toLowerCase()}</span></span>}
          </button>
          <button type="button" onClick={handleLogout} title="Sign out" className={cn('flex w-full items-center rounded-xl border border-[#c85d51]/30 text-xs font-bold text-[#f0aaa2] transition-colors duration-200 hover:bg-[#c85d51]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3a25a]', collapsed ? 'justify-center p-2' : 'justify-center gap-2 px-3 py-2.5')}>
            <LogOut size={15} />{!collapsed && 'Sign out'}
          </button>
        </div>
        <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} title={collapsed ? 'Expand navigation' : 'Collapse navigation'} className="absolute -right-3 top-[4.75rem] hidden h-7 w-7 items-center justify-center rounded-full border border-[#c3a25a]/50 bg-[#073b5c] text-[#e3c477] shadow-lg transition-colors duration-200 hover:bg-[#0d526b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3a25a] lg:flex">
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
        {!collapsed && <PanelLeftClose aria-hidden="true" className="pointer-events-none absolute bottom-5 right-4 text-white/10" size={26} />}
      </aside>
    </>
  );
};

export default Sidebar;