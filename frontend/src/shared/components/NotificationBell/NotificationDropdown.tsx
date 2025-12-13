import { formatDistanceToNow } from "date-fns";
import {
  X,
  CheckCheck,
  Trash2,
  AlertCircle,
  Activity,
  TrendingUp,
  Bell as BellIcon,
} from "lucide-react";
import React, { useEffect, useRef } from "react";

import { Notification } from "./NotificationBell";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

/**
 * Notification Dropdown Component
 * Shows list of notifications with actions
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onClose,
  onMarkAsRead: _onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "health":
      case "alert":
        return <Activity className="h-5 w-5 text-red-500" />;
      case "recommendation":
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      case "yield":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500";
      case "medium":
        return "border-l-4 border-yellow-500";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">{unreadCount} unread</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          {onMarkAllAsRead && unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center text-sm text-brand-blue hover:text-blue-700 font-medium"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all as read
            </button>
          )}
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="flex items-center text-sm text-gray-600 hover:text-red-600 font-medium ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <BellIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-center">No notifications</p>
            <p className="text-gray-400 text-sm text-center mt-1">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const handleNotificationKeyDown = (
                event: React.KeyboardEvent,
              ) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onNotificationClick?.(notification);
                }
              };

              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNotificationClick?.(notification)}
                  onKeyDown={handleNotificationKeyDown}
                  className={`
                    px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors
                    ${!notification.read ? "bg-blue-50" : ""}
                    ${getPriorityColor(notification.priority)}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p
                          className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="ml-2 flex-shrink-0 inline-block h-2 w-2 rounded-full bg-brand-blue"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.fieldName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Field: {notification.fieldName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="text-sm text-brand-blue hover:text-blue-700 font-medium w-full text-center"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
