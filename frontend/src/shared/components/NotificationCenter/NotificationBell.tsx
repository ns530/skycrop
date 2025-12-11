/**
 * NotificationBell Component
 * 
 * Bell icon with unread count badge
 * Toggles notification center dropdown
 */

import React, { useState, useEffect } from 'react';

import { notificationService } from '../../services/notificationService';

interface NotificationBellProps {
  onClick: () => void;
  isOpen: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, isOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial count
    setUnreadCount(notificationService.getUnreadCount());

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };

    window.addEventListener('skycrop:notification', handleNotificationUpdate);

    return () => {
      window.removeEventListener('skycrop:notification', handleNotificationUpdate);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center
        h-9 w-9 rounded-md
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}
      `}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Bell Icon */}
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

