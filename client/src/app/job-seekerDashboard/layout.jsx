"use client";
import {
  DesktopAppSidebar,
  MobileAppSidebar,
} from "@/components/common/AppSidebar"; // Import separate components
import { SidebarProvider } from "@/components/ui/sidebar";
import useAuthStore from "@/store/authStore";
import { useEffect } from "react";
import { DashboardNavbar } from "@/components/userDashboard/navbar";
import { useRouter } from "next/navigation";
import { useAuthNetworkStatus } from "@/store/UseAuthNetwork";
import OfflinePage from "@/components/common/Offline";
import { DashboardSkeleton } from "@/components/common/Skeleton/UserDashbNetRec";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import useChatStore from "@/store/recruiter/ChatStore";
import { getChatSocket, getStatusSocket } from "@/lib/common/SocketClient";
import useNotificationStore from "@/store/common/notificationStore";

export default function DashboardLayout({ children }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const router = useRouter();
  const {
    isOffline,
    checkNetwork,
    isReconnecting,
    initialCheckComplete,
    setInitialCheckComplete,
  } = useAuthNetworkStatus();
  const { user } = useAuthStore();
  const chatStore = useChatStore();
  const notifStore = useNotificationStore();

  useEffect(() => {
    if (!user?.id) return;
    notifStore.fetchNotifications();
  }, [user?.id]);

  // ---------------------------
  // 🧠 Sync current user
  // ---------------------------
  useEffect(() => {
    if (user?.id) {
      chatStore.setCurrentUserId(user.id);
    }
  }, [user?.id]);

  // ---------------------------
  // 💬 Load chat history
  // ---------------------------
  useEffect(() => {
    if (!user?.id) return;
    const loadChats = async () => {
      try {
        await chatStore.fetchAllChatsWithMessages();
      } catch (err) {
        toast.error("Failed to load chats and messages: " + err.message);
      }
    };
    loadChats();
  }, [user?.id]);

  // ---------------------------
  // 🩵 Keep user activity alive
  // ---------------------------
  useEffect(() => {
    if (!user?.id) return;
    API.post("/job-seeker/activity/ping").catch((err) =>
      toast.error(err.message)
    );
  }, [user]);

  // ---------------------------
  // ⚡ Socket Connections
  // ---------------------------
  useEffect(() => {
    const userId = user?.id;
    const role_type = "job-seeker";
    if (!userId || !role_type) return;

    // ✅ Get singleton sockets
    const chatSocket = getChatSocket();
    const statusSocket = getStatusSocket();

    // ✅ Attach query before connect
    chatSocket.io.opts.query = { userId, role_type };
    statusSocket.io.opts.query = { userId, role_type };

    // ✅ Connect both if not already connected
    if (!chatSocket.connected) chatSocket.connect();
    if (!statusSocket.connected) statusSocket.connect();

    // ------------------------
    // 📡 Debug & lifecycle logs
    // ------------------------
    chatSocket.on("connect", () => {});
    statusSocket.on("connect", () => {});
    chatSocket.on("disconnect", () => {});
    statusSocket.on("disconnect", () => {});

    // ------------------------
    // 👥 Listen for online/offline updates
    // ------------------------
    statusSocket.on("userStatusUpdate", (data) => {
      chatStore.updateUserStatus(data._id, data);
    });

    // ------------------------
    // ✉️ Listen for message status updates
    // ------------------------
    statusSocket.on("messageStatusUpdate", (data) => {
      const { chatId, messageIds = [], status } = data;
      if (Array.isArray(messageIds) && messageIds.length > 0) {
        messageIds.forEach((mid) =>
          chatStore.updateMessageStatus(chatId, mid, status)
        );
      } else {
        chatStore.updateAllMessageStatus(chatId, status);
      }
    });

    // 🧹 Cleanup listeners on unmount (not disconnect)
    return () => {
      chatSocket.removeAllListeners();
      statusSocket.removeAllListeners();
      // DO NOT disconnect here — keep sockets alive for navigation
    };
  }, [user?.id]);

  // ---------------------------
  // 🔐 Authentication check
  // ---------------------------
  useEffect(() => {
    const verifyAuth = async () => {
      const isCurrentlyOffline = checkNetwork();
      if (!isCurrentlyOffline) {
        try {
          await checkAuth();
          setInitialCheckComplete(true);
          return;
        } catch (error) {
          console.error("Authentication check failed:", error);
        }
      }
      setInitialCheckComplete(true);
    };
    verifyAuth();
  }, [router]);

  // ---------------------------
  // ⏳ UI State Handling
  // ---------------------------
  if (!initialCheckComplete || isReconnecting) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <OfflinePage />
      </div>
    );
  }

  // ---------------------------
  // 🧱 Layout UI
  // ---------------------------
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Render separate components */}
        <div className="hidden md:block">
          <DesktopAppSidebar />
        </div>
        {/* Explicitly hide MobileAppSidebar on ≥768px */}
        <div className="md:hidden">
          <MobileAppSidebar />
        </div>
        <div className="flex-1 overflow-x-hidden flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 overflow-x-hidden pb-24">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
