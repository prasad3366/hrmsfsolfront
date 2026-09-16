import React, { useEffect } from 'react';
import { X, Check, AlertCircle, Clock, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { markAsRead, markAllAsRead, clearNotifications, removeNotification, getFilteredNotifications } =
    useNotifications();
  const authContext = useAuth();
  
  // Get current user role and ID (fallback to 'EMPLOYEE' and 0 if not available)
  const userRole = authContext.user?.role || 'EMPLOYEE';
  const userId = authContext.user?.employeeId || 0;
  
  // Filter notifications based on user role and ID
  const filteredNotifications = getFilteredNotifications(userRole, userId);
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#022337]/25 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <div className="fixed right-3 top-16 z-50 flex max-h-[min(600px,calc(100vh-5rem))] w-[calc(100vw-1.5rem)] max-w-96 flex-col overflow-hidden rounded-2xl border border-[#dce6e8] bg-[#fffefa] shadow-[0_24px_70px_rgba(2,35,55,0.2)] sm:right-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#dce6e8] bg-gradient-to-r from-[#f6faf9] to-[#eaf3f7] p-5">
          <div>
            <h2 className="text-lg font-bold text-[#073b5c]">Notifications</h2>
            {filteredUnreadCount > 0 && (
              <p className="mt-1 text-xs text-[#617984]">{filteredUnreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-lg p-2 text-[#78909a] transition-colors hover:bg-[#dce6e8] hover:text-[#12354a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Actions */}
        {filteredNotifications.length > 0 && (
          <div className="flex gap-3 border-b border-[#e4ecec] bg-[#f6faf9] px-5 py-3 text-xs">
            {filteredUnreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="font-semibold text-[#1e627d] transition-colors hover:text-[#073b5c]"
              >
                ✓ Mark all as read
              </button>
            )}
            <button
              onClick={clearNotifications}
              className="ml-auto font-semibold text-[#617984] transition-colors hover:text-[#a63e35]"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-[#78909a]">
              <Bell size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="mt-1 text-xs">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#edf3f5]">
              {filteredNotifications.map((notif) => (
                <button
                  type="button"
                  key={notif.id}
                  onClick={() => notif.read === false && markAsRead(notif.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-all cursor-pointer border-l-4 ${
                    notif.read === false
                      ? 'bg-[#eaf3f7] border-l-[#b08a3e]'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-snug text-[#12354a]">
                          {notif.title}
                        </h3>
                        {notif.read === false && (
                          <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#c85d51]" />
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#617984]">{notif.message}</p>
                      <span className="mt-2 block text-xs text-[#8aa0aa]">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      aria-label={`Remove notification: ${notif.title}`}
                      className="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#edf3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]"
                    >
                      <X size={16} className="text-[#78909a]" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
