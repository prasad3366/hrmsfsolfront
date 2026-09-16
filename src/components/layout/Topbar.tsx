import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, Search } from 'lucide-react';
import { Avatar } from '../ui/components';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationPanel } from './NotificationPanel';

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false);

  const pageTitle = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const formattedTitle = pageTitle.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-[#dce6e8]/80 bg-[#fffefa]/95 px-4 shadow-[0_4px_20px_rgba(7,59,92,0.06)] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-[#486271] transition-colors duration-200 hover:bg-[#edf3f5] hover:text-[#073b5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e] lg:hidden"
        >
          <Menu size={21} />
        </button>
        <div className="hidden min-w-0 sm:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8aa0aa]">Workspace</p>
          <h1 className="truncate text-base font-bold text-[#073b5c]">{formattedTitle}</h1>
        </div>
        <div className="relative ml-2 hidden w-full max-w-xs md:block">
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#78909a]" />
          <input type="search" placeholder="Search anything..." aria-label="Search anything" className="h-10 w-full rounded-xl border border-[#dce6e8] bg-[#f6faf9] pl-10 pr-4 text-sm text-[#12354a] transition-all duration-200 placeholder:text-[#8aa0aa] focus:border-[#b08a3e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b08a3e]/20" />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={isNotificationPanelOpen} onClick={() => setIsNotificationPanelOpen((open) => !open)} className="relative rounded-xl p-2.5 text-[#486271] transition-colors duration-200 hover:bg-[#edf3f5] hover:text-[#073b5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]">
          <Bell size={19} />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c85d51] px-1 text-[9px] font-bold text-white ring-2 ring-[#fffefa]">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
        <div className="hidden h-8 w-px bg-[#dce6e8] sm:block" />
        <button type="button" onClick={() => { if (!user?.employeeId) { alert('Employee ID not found. Please refresh the page.'); return; } navigate(`/employees/${user.employeeId}`); }} className="group flex items-center gap-2 rounded-xl p-1.5 pr-2 transition-colors duration-200 hover:bg-[#edf3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]" title="View your profile">
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" />
          <span className="hidden text-left sm:block"><span className="block max-w-32 truncate text-xs font-bold text-[#12354a]">{user?.name}</span><span className="block text-[10px] font-semibold uppercase tracking-wide text-[#8aa0aa]">{user?.role?.replaceAll('_', ' ')}</span></span>
        </button>
      </div>
      <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} />
    </header>
  );
};

export default Topbar;