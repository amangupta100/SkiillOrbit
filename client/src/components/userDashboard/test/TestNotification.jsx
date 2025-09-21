"use client";
import React, { useEffect, useState } from "react";

const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_TYPES = {
  warning: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Warning",
  },
  error: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Violation",
  },
  info: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Info",
  },
};

const TestNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const updateNotifications = () => {
      const stored = JSON.parse(
        sessionStorage.getItem("proctoringNotifications") || "[]"
      );
      setNotifications(
        Array.isArray(stored) ? stored.slice(0, MAX_NOTIFICATIONS) : []
      );
    };

    updateNotifications();
    window.addEventListener(
      "proctoringNotificationUpdate",
      updateNotifications
    );
    return () =>
      window.removeEventListener(
        "proctoringNotificationUpdate",
        updateNotifications
      );
  }, []);

  const markAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    sessionStorage.setItem("proctoringNotifications", JSON.stringify(updated));
  };

  const clearNotification = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    sessionStorage.setItem("proctoringNotifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("proctoringNotificationUpdate"));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    sessionStorage.removeItem("proctoringNotifications");
    window.dispatchEvent(new Event("proctoringNotificationUpdate"));
  };

  return (
    <div className="absolute z-[100] top-16 right-48 rounded-lg w-[400px] max-h-[400px] bg-white border-[1.6px] border-zinc-300 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-200">
        <h2 className="text-lg font-bold flex justify-between items-center">
          <span>Proctoring Alerts</span>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Clear All
            </button>
          )}
        </h2>
      </div>

      {notifications.length > 0 ? (
        <div className="divide-y divide-zinc-100 max-h-[352px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-zinc-50 transition-colors ${
                notification.read ? "opacity-75" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium">{notification.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        NOTIFICATION_TYPES[notification.messageType]?.bg ||
                        "bg-gray-100"
                      } ${
                        NOTIFICATION_TYPES[notification.messageType]?.text ||
                        "text-gray-800"
                      }`}
                    >
                      {NOTIFICATION_TYPES[notification.messageType]?.label ||
                        "Alert"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notification.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                  aria-label="Dismiss notification"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-500">No proctoring alerts</p>
        </div>
      )}
    </div>
  );
};

export default TestNotification;
