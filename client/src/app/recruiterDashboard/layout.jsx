"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  DesktopAppSidebar,
  MobileAppSidebar,
} from "@/components/common/AppSidebar";
import { DashboardNavbar } from "@/components/userDashboard/navbar";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import useChatStore from "@/store/recruiter/ChatStore";
import { getChatSocket, getStatusSocket } from "@/lib/common/SocketClient";

const layout = ({ children }) => {
  const { recruiter } = useRecruiterAuthStore();
  const checkAuth = useRecruiterAuthStore((state) => state.checkAuth);
  const router = useRouter();
  const chatStore = useChatStore();

  useEffect(() => {
    if (recruiter?.id) {
      chatStore.setCurrentUserId(recruiter.id);
    }
  }, [recruiter?.id]);

  useEffect(() => {
    if (!recruiter?.id) return;

    const loadChats = async () => {
      try {
        await chatStore.fetchAllChatsWithMessages();
      } catch (err) {
        toast.error("Failed to load chats and messages: " + err.message);
      }
    };

    loadChats();
  }, [recruiter?.id]);

  useEffect(() => {
    const userId = recruiter?.id;
    const role_type = "recruiter";
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
  }, [recruiter?.id]);

  useEffect(() => {
    checkAuth();
  }, [router]);
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
};

export default layout;
