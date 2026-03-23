import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from '../../context/NotificationContext';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 px-6 flex items-center justify-between md:ml-64">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center flex-1">
        <button className="md:hidden mr-4 text-slate-500">
            <Menu size={24} />
        </button>
        <div className="relative w-64 hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        
        {/* Profile - Click to navigate to employee details */}
        <button
          onClick={() => {
            if (!user?.employeeId) {
              alert('Employee ID not found. Please refresh the page.');
              return;
            }
            navigate(`/employees/${user.employeeId}`);
          }}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          title="View your profile"
        >
          <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full border-2 border-slate-200 hover:border-blue-400" />
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-500 uppercase">My Profile</span>
            <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
          </div>
        </button>
        
        <div className="hidden md:flex flex-col items-end">
             <span className="text-sm font-semibold text-slate-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
             <span className="text-xs text-slate-500">FooDeeZ</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;