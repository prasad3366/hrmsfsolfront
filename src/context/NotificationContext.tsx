import React, { createContext, useContext, useState, useCallback } from 'react';

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

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 10000);
    }
  }, []);

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

  const getFilteredNotifications = useCallback((userRole: string, userId: number): Notification[] => {
    return notifications.filter((n) => {
      // If no recipient roles specified, show to all
      if (!n.recipientRoles || n.recipientRoles.length === 0) {
        return true;
      }
      // If user's role is in recipient list
      const roleMatch = n.recipientRoles.includes(userRole);
      if (!roleMatch) return false;

      // If no specific recipient IDs, show to all users in that role
      if (!n.recipientIds || n.recipientIds.length === 0) {
        return true;
      }
      // Show only if user ID is in the list
      return n.recipientIds.includes(userId);
    });
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
        getFilteredNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
