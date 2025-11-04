"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import useChatStore from "@/store/recruiter/ChatStore";
import { getChatSocket } from "@/lib/common/SocketClient"; // ✅ shared socket
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import useAuthStore from "@/store/authStore";

export default function useChatSocket({ userId, role_type }) {
  const { recruiter } = useRecruiterAuthStore();
  const { user } = useAuthStore();
  useEffect(() => {
    if (!userId || !role_type) return;

    // ✅ Use shared singleton socket
    const socket = getChatSocket();

    // Attach userId and role_type before connecting
    socket.io.opts.query = { userId, role_type };

    if (!socket.connected) {
      socket.connect();
    }

    // 🔹 Connection logs
    socket.on("connect", () => {});
    socket.on("disconnect", () => {});

    // =========================================================
    // 🟢 Online/offline updates (redundant, but safe)
    // =========================================================
    socket.on("userStatusUpdate", (data) => {
      useChatStore.getState().updateUserStatus(data._id, data);
    });

    // =========================================================
    // 🟣 Handle new incoming message
    // =========================================================
    socket.on("receiveMessage", ({ chat, chatId, message }) => {
      const chatStore = useChatStore.getState();
      const currentUserId = chatStore.currentUserId;
      const isMine = message.senderId?.toString() === currentUserId?.toString();

      if (isMine) return; // ignore our own messages

      // ✅ Add message (this updates `messages` state, triggering selectors)
      chatStore.addMessage(chatId, { ...message, isMine: false });

      // ✅ Update chat list with latest message
      const lastMessageData = {
        content: message.content,
        media: message.media || [],
        createdAt: message.createdAt,
      };

      const existingChat = chatStore.chats.find((c) => c._id === chatId);
      if (existingChat) {
        const updatedChats = chatStore.chats.map((c) =>
          c._id === chatId
            ? { ...c, lastMessage: lastMessageData, updatedAt: new Date() }
            : c
        );
        chatStore.setChats(updatedChats);
      } else {
        chatStore.setChats([chat, ...chatStore.chats]);
      }

      // 🔔 Play sound only for receiver (no force needed here)
      if (!message.isHistory) {
        try {
          const ping = new Audio("/ping_sound_effect.mp3");
          ping.volume = 0.25;
          ping.play().catch(() => {});
        } catch {}
      }

      // ✅ Optional: Log for debugging (remove in prod)
      console.log(
        `📩 New message in ${chatId}. Updated unread count: ${chatStore.getUnreadCount()}`
      );
    });

    // =========================================================
    // 🟢 Message sent confirmation (update optimistic, don't add duplicate)
    // =========================================================
    socket.on("messageSent", ({ chatId, message }) => {
      const chatStore = useChatStore.getState();
      // 🔄 Update existing optimistic message by clientMessageId
      const messages = chatStore.messages[chatId] || [];
      const optimisticIndex = messages.findIndex(
        (m) => m.clientMessageId === message.clientMessageId
      );
      if (optimisticIndex !== -1) {
        // Replace with server data (keeps isMine, adds _id, status, etc.)
        const updatedMessages = [...messages];
        updatedMessages[optimisticIndex] = {
          ...messages[optimisticIndex],
          ...message, // Overwrite with server fields (_id, status="sent"/"delivered"/"read", etc.)
          clientMessageId: undefined, // Clean up
          isMine: true, // Ensure for sent
        };
        chatStore.setMessages(chatId, updatedMessages);
      } else {
        // Fallback: add if no optimistic found (rare)
        chatStore.addMessage(chatId, { ...message, isMine: true });
      }
    });

    // =========================================================
    // 🟡 Message status updates (delivered / seen)
    // =========================================================
    // In useChatSocket
    socket.on("messageStatusUpdate", (data) => {
      const { chatId, messageIds, status } = data;

      const store = useChatStore.getState();

      // 🔑 OPTIONAL: Guard to skip noisy logs during optimistic phase (reduces race artifacts)
      const currentMessages = store.messages[chatId] || [];
      const hasPendingOptimistic = currentMessages.some(
        (msg) => !msg._id && msg.clientMessageId
      );
      if (hasPendingOptimistic && status !== "sent") {
        // Skip non-initial statuses while pending
        console.log("⏭️ Skipping status update during optimistic phase");
        return;
      }

      // Log current store state (optional, for debugging)
      console.log("📊 Status update incoming:", { chatId, messageIds, status });

      messageIds.forEach((msgId) => {
        store.updateMessageStatus(chatId, msgId, status);
      });
    });

    // =========================================================
    // ✍️ Typing indicators
    // =========================================================
    socket.on("typing", ({ senderId }) => {});

    socket.on("stopTyping", ({ senderId }) => {});

    // =========================================================
    // 🧹 Cleanup listeners (keep socket alive)
    // =========================================================
    return () => {
      socket.removeAllListeners(); // remove event listeners only
      // ❌ DO NOT disconnect — shared across app
    };
  }, [userId, role_type]);

  // ========================
  // 🔹 Emit functions
  // ========================
  const socket = getChatSocket();

  // 🟢 Send message handler (exposed function)
  const sendMessage = (messageData) => {
    if (!socket.connected) {
      console.warn("⚠️ Chat socket not connected yet");
      return;
    }
    // 🔄 Generate clientMessageId for optimistic tracking
    const clientMessageId = crypto.randomUUID();
    const dataWithId = { ...messageData, clientMessageId };
    socket.emit("sendMessage", dataWithId);
    return clientMessageId; // Return for caller to use in optimistic
  };
  const markAsSeen = ({ chatId, userId }) => {
    socket.emit("markAsSeen", { chatId, userId });
  };

  const emitTyping = (receiverId, senderId) => {
    socket.emit("typing", { receiverId, senderId });
  };

  const stopTyping = (receiverId, senderId) => {
    socket.emit("stopTyping", { receiverId, senderId });
  };

  const openChat = ({ chatId, viewerId }) => {
    socket.emit("openChat", { chatId, viewerId });
  };

  // Add this inside your hook (below openChat)
  const closeChat = ({ chatId, viewerId }) => {
    if (!socket.connected) return;
    socket.emit("closeChat", { chatId, viewerId });
  };

  return {
    sendMessage,
    markAsSeen,
    openChat,
    emitTyping,
    stopTyping,
    closeChat,
  };
}
