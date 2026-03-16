import React, { useContext } from 'react';
import { X, Check, CheckCheck, AlertCircle, Clock, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AuthProvider} from '../../context/AuthContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications, removeNotification, unreadCount, getFilteredNotifications } =
    useNotifications();
  const authContext = useContext(AuthProvider);
  
  // Get current user role and ID (fallback to 'EMPLOYEE' and 0 if not available)
  const userRole = authContext?.user?.role || 'EMPLOYEE';
  const userId = authContext?.user?.employeeId || 0;
  
  // Filter notifications based on user role and ID
  const filteredNotifications = getFilteredNotifications(userRole, userId);
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'wfh_request':
        return <Clock size={18} className="text-blue-600" />;
      case 'wfh_approved':
        return <Check size={18} className="text-emerald-600" />;
      case 'wfh_rejected':
        return <AlertCircle size={18} className="text-red-600" />;
      case 'punch_in':
      case 'punch_out':
        return <Clock size={18} className="text-blue-600" />;
      case 'leave_request':
        return <Clock size={18} className="text-purple-600" />;
      default:
        return <Bell size={18} className="text-slate-600" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-16 right-6 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Notifications</h2>
            {filteredUnreadCount > 0 && (
              <p className="text-xs text-slate-600 mt-1">{filteredUnreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Actions */}
        {filteredNotifications.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-200 flex gap-3 text-xs bg-slate-50">
            {filteredUnreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                ✓ Mark all as read
              </button>
            )}
            <button
              onClick={clearNotifications}
              className="text-slate-600 hover:text-red-600 font-semibold ml-auto transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Bell size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`p-4 hover:bg-slate-50 transition-all cursor-pointer border-l-4 ${
                    !notif.read 
                      ? 'bg-blue-50 border-l-blue-500' 
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <span className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{notif.message}</p>
                      <span className="text-xs text-slate-400 mt-2 block">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
