import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface Notification {
  id: string;
  type: 'wfh_request' | 'wfh_approved' | 'wfh_rejected' | 'punch_in' | 'punch_out' | 'leave_request' | 'other';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  // Role-based filtering: if empty, show to all; otherwise only to specified roles
  recipientRoles?: string[];
  // User-specific: if empty, show to all users of that role; otherwise only to specific userIds
  recipientIds?: number[];
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  // Filter notifications for current user
  getFilteredNotifications: (userRole: string, userId: number) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper function to reduce nesting complexity in filtering
const shouldShowNotification = (notification: Notification, userRole: string, userId: number): boolean => {
  const hasRoleRestriction = notification.recipientRoles && notification.recipientRoles.length > 0;

  if (!hasRoleRestriction) return true;

  const roleMatches = notification.recipientRoles.includes(userRole);
  if (!roleMatches) return false;

  const hasUserRestriction = notification.recipientIds && notification.recipientIds.length > 0;
  if (!hasUserRestriction) return true;

  return notification.recipientIds.includes(userId);
};

const scheduleNotificationRemoval = (id: string, removeFn: (id: string) => void) => {
  setTimeout(() => {
    removeFn(id);
  }, 10000);
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotificationAfterTimeout = useCallback((notificationId: string) => {
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, 10000);
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotif: Notification = {
      ...notif,
      id,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Auto-remove notification after 10 seconds if it's a temporary one
    if (notif.type === 'punch_in' || notif.type === 'punch_out') {
      scheduleNotificationRemoval(id, removeNotificationAfterTimeout);
    }
  }, [removeNotificationAfterTimeout]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getFilteredNotifications = useCallback(
    (userRole: string, userId: number): Notification[] => {
      return notifications.filter((n) => shouldShowNotification(n, userRole, userId));
    },
    [notifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      removeNotification,
      getFilteredNotifications,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications, removeNotification, getFilteredNotifications]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
