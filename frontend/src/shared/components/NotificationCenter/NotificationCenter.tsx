/**
 * NotificationCenter Component
 * 
 * Dropdown panel showing recent notifications
 * with actions to mark as read, clear, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, type StoredNotification } from '../../services/notificationService';
import { Button } from '../../ui/Button';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNotifications(notificationService.getStoredNotifications());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      setNotifications(notificationService.getStoredNotifications());
    };

    window.addEventListener('skycrop:notification', handleNotificationUpdate);

    return () => {
      window.removeEventListener('skycrop:notification', handleNotificationUpdate);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: StoredNotification) => {
    notificationService.markAsRead(notification.id);
    
    if (notification.url) {
      navigate(notification.url);
      onClose();
    } else if (notification.fieldId) {
      navigate(`/fields/${notification.fieldId}`);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getStoredNotifications());
  };

  const handleClearAll = () => {
    if (confirm('Clear all notifications?')) {
      notificationService.clearAll();
      setNotifications([]);
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    notificationService.dismissNotification(notificationId);
    setNotifications(notificationService.getStoredNotifications());
  };

  const activeNotifications = notifications.filter((n) => !n.dismissed);
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-xl"
      role="dialog"
      aria-label="Notification center"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {unreadCount} new
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {activeNotifications.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[480px] overflow-y-auto">
        {activeNotifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-sm font-medium text-gray-900 mb-1">No notifications</p>
            <p className="text-xs text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDismiss={(e) => handleDismiss(e, notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {activeNotifications.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3 text-center">
          <button
            type="button"
            onClick={() => {
              navigate('/settings/notifications');
              onClose();
            }}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            Notification settings
          </button>
        </div>
      )}
    </div>
  );
};

// --------------------
// NotificationItem Component
// --------------------

interface NotificationItemProps {
  notification: StoredNotification;
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick, onDismiss }) => {
  const getTypeIcon = () => {
    const icons = {
      'health-alert': '🚨',
      'weather-warning': '🌧️',
      'recommendation': '🤖',
      'yield-update': '📊',
      'system': '⚙️',
      'general': '📰',
    };
    return icons[notification.type] || '📬';
  };

  const getPriorityColor = () => {
    const colors = {
      critical: 'bg-red-50 border-l-4 border-l-red-500',
      high: 'bg-orange-50 border-l-4 border-l-orange-500',
      medium: 'bg-blue-50 border-l-4 border-l-blue-500',
      low: 'bg-gray-50 border-l-4 border-l-gray-300',
    };
    return colors[notification.priority] || colors.low;
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative px-4 py-3 cursor-pointer transition-colors
        hover:bg-gray-50
        ${!notification.read ? getPriorityColor() : 'bg-white'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{getTypeIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            
            {/* Dismiss button */}
            <button
              type="button"
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {notification.body}
          </p>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{getRelativeTime(notification.timestamp)}</span>
            {!notification.read && (
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;

