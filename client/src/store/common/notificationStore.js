"use client";
import { create } from "zustand";
import { toast } from "sonner";
import API from "@/utils/interceptor";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  // ===========================
  // 🔥 Fetch All Notifications
  // ===========================
  fetchNotifications: async () => {
    try {
      set({ loading: true });

      const res = await API.get("/common/notification/getallNotf");

      const list = res.data.notifications || [];

      const unread = list.filter((n) => !n.read).length;

      set({
        notifications: list,
        unreadCount: unread,
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      toast.error("Failed to load notifications");
    }
  },

  // ===========================
  // 🔵 Mark All as Read
  // ===========================
  markAsRead: async () => {
    try {
      await API.put("/common/notification/markNotfRead");

      // Update state locally
      const updated = get().notifications.map((n) => ({
        ...n,
        read: true,
      }));

      set({
        notifications: updated,
        unreadCount: 0,
      });
    } catch (err) {
      toast.error("Failed to mark notifications as read");
    }
  },

  // ===========================
  // 🗑 Clear All Notifications
  // ===========================
  clearNotifications: async () => {
    try {
      await API.post("/common/notification/clearNotif");

      set({
        notifications: [],
        unreadCount: 0,
      });
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  },
}));

export default useNotificationStore;
