'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getNotificationManager,
  RealtimeNotification,
  NotificationType,
} from '@/lib/realtime/notifications';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationCenterProps {
  userId: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  booking_created: '📅',
  booking_confirmed: '✅',
  booking_canceled: '❌',
  session_started: '🎬',
  session_completed: '🎉',
  session_reminder: '⏰',
  credit_added: '💳',
  credit_low: '⚠️',
  mastery_updated: '📈',
  homework_assigned: '📝',
  homework_submitted: '📤',
  message_received: '💬',
  system_announcement: '📢',
};

/**
 * Notification Center Component
 * Displays real-time notifications with dropdown
 */
export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize notification manager
  useEffect(() => {
    const manager = getNotificationManager();

    const init = async () => {
      await manager.subscribe(userId);

      // Load initial notifications
      const recent = await manager.getRecent(20);
      setNotifications(recent);

      const count = await manager.getUnreadCount();
      setUnreadCount(count);

      setIsLoading(false);
    };

    init();

    // Listen for new notifications
    const unsubscribe = manager.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permitted
      showBrowserNotification(notification);
    });

    return () => {
      unsubscribe();
      manager.unsubscribe();
    };
  }, [userId]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: RealtimeNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, []);

  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    const manager = getNotificationManager();
    await manager.markAsRead(notificationId);

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const manager = getNotificationManager();
    await manager.markAllAsRead();

    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  // Request browser notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {'Notification' in window && Notification.permission === 'default' && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={requestPermission}
                  className="w-full text-sm text-blue-600 hover:underline"
                >
                  Enable browser notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Single Notification Item
 */
function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: RealtimeNotification;
  onMarkAsRead: (id: string) => void;
}) {
  const isUnread = !notification.read_at;
  const icon = NOTIFICATION_ICONS[notification.type] || '📬';

  return (
    <div
      className={`px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${
        isUnread ? 'bg-blue-50/50' : ''
      }`}
      onClick={() => isUnread && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
              {notification.title}
            </p>
            {isUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-sm text-slate-500 line-clamp-2">{notification.message}</p>
          <p className="text-xs text-slate-400 mt-1">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Toast Notification for temporary alerts
 */
export function NotificationToast({
  notification,
  onClose,
}: {
  notification: RealtimeNotification;
  onClose: () => void;
}) {
  const icon = NOTIFICATION_ICONS[notification.type] || '📬';

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{notification.title}</p>
            <p className="text-sm text-slate-500 line-clamp-2">{notification.message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
