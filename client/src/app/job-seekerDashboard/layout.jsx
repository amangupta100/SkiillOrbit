"use client";
import {
  DesktopAppSidebar,
  MobileAppSidebar,
} from "@/components/common/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import useAuthStore from "@/store/authStore";
import { useEffect } from "react";
import { DashboardNavbar } from "@/components/userDashboard/navbar";
import { useAuthNetworkStatus } from "@/store/UseAuthNetwork";
import OfflinePage from "@/components/common/Offline";
import { DashboardSkeleton } from "@/components/common/Skeleton/UserDashbNetRec";
import API from "@/utils/interceptor";
import useChatStore from "@/store/recruiter/ChatStore";
import { getChatSocket, getStatusSocket } from "@/lib/common/SocketClient";
import useNotificationStore from "@/store/common/notificationStore";

export default function DashboardLayout({ children }) {
  const { checkAuth, user } = useAuthStore();

  const {
    isOffline,
    checkNetwork,
    isReconnecting,
    initialCheckComplete,
    setInitialCheckComplete,
  } = useAuthNetworkStatus();

  const chatStore = useChatStore();

  /** ----------------------------------------------------
   * 1) AUTH → LOAD ONLY ONCE (FAST)
   -----------------------------------------------------*/
  useEffect(() => {
    (async () => {
      const offline = checkNetwork();
      if (!offline) {
        await checkAuth();
      }
      setInitialCheckComplete(true);
    })();
  }, []);

  /** ----------------------------------------------------
   * 3) SET USER ID FOR CHAT STORE (LIGHT)
   -----------------------------------------------------*/
  useEffect(() => {
    if (user?.id) chatStore.setCurrentUserId(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    API.post("/job-seeker/activity/ping").catch(() => {});
  }, [user]);

  /** ----------------------------------------------------
   * 6) SOCKETS (ONLY ONCE)
   -----------------------------------------------------*/
  useEffect(() => {
    if (!user?.id) return;

    const chatSocket = getChatSocket();
    const statusSocket = getStatusSocket();

    chatSocket.io.opts.query = { userId: user.id, role_type: "job-seeker" };
    statusSocket.io.opts.query = { userId: user.id, role_type: "job-seeker" };

    if (!chatSocket.connected) chatSocket.connect();
    if (!statusSocket.connected) statusSocket.connect();

    // Status Updates
    statusSocket.on("userStatusUpdate", (data) => {
      chatStore.updateUserStatus(data._id, data);
    });

    statusSocket.on("messageStatusUpdate", (data) => {
      const { chatId, messageIds = [], status } = data;
      messageIds.length
        ? messageIds.forEach((mid) =>
            chatStore.updateMessageStatus(chatId, mid, status)
          )
        : chatStore.updateAllMessageStatus(chatId, status);
    });

    return () => {
      chatSocket.removeAllListeners();
      statusSocket.removeAllListeners();
    };
  }, [user?.id]);

  /** ----------------------------------------------------
   * UI LOADING STATES
   -----------------------------------------------------*/
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

  /** ----------------------------------------------------
   * LAYOUT UI
   -----------------------------------------------------*/
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <div className="hidden md:block">
          <DesktopAppSidebar />
        </div>
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
