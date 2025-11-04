import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "@/utils/interceptor";
import { toast } from "sonner";

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const useChatStore = create(
  persist(
    (set, get) => ({
      chats: [],
      messages: {}, // { [chatId]: [msg,...] }
      selectedChat: null,
      loading: false,
      messageLoading: false,
      currentUserId: null, // ✅ add this

      // ----------------------------
      // 🔹 Basic setters
      // ----------------------------
      setLoading: (v) => set({ loading: v }),
      setMessageLoading: (v) => set({ messageLoading: v }),
      setChats: (chats) => set({ chats }),
      setSelectedChat: (chat) => set({ selectedChat: chat }),
      setCurrentUserId: (id) => set({ currentUserId: id }),

      // ----------------------------
      // 🔹 Message management
      // ----------------------------
      addMessage: (chatId, message) => {
        set((state) => {
          const prev = state.messages[chatId] || [];
          const exists = prev.some(
            (m) =>
              m._id === message._id || // Server ID match
              (m.clientMessageId &&
                m.clientMessageId === message.clientMessageId) || // 🔄 NEW: Match optimistic
              (m.content === message.content &&
                Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) <
                  1000)
          );
          if (exists) return state;

          return {
            messages: {
              ...state.messages,
              [chatId]: [...prev, message],
            },
          };
        });
      },

      setMessages: (chatId, newMessages) => {
        set((state) => {
          const existing = state.messages[chatId] || [];
          const merged = [...existing]; // Start with socket-added ones

          newMessages.forEach((newMsg) => {
            // Dedup check: _id, clientId, or content + close timestamp
            const exists = merged.some(
              (existingMsg) =>
                existingMsg._id === newMsg._id ||
                (existingMsg.clientMessageId &&
                  existingMsg.clientMessageId === newMsg.clientMessageId) ||
                (existingMsg.content === newMsg.content &&
                  Math.abs(
                    new Date(existingMsg.createdAt).getTime() -
                      new Date(newMsg.createdAt).getTime()
                  ) < 5000) // 5s window for dupes
            );
            if (!exists) {
              merged.push({ ...newMsg, isHistory: true }); // Mark as loaded
            }
          });

          // Sort by createdAt (ensures order)
          merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          return {
            messages: { ...state.messages, [chatId]: merged },
          };
        });
      },

      // Fix: Normalize IDs to strings for comparison
      updateMessageStatus: (chatId, messageId, status) => {
        set((state) => {
          console.log(chatId, messageId, status);
          const chatMessages = state.messages[chatId];
          if (!chatMessages) return state;

          const normalizedTargetId = String(messageId); // Convert to string

          const updatedMessages = chatMessages.map((msg) => {
            const normalizedMsgId = String(msg._id);
            const normalizedClientId = msg.clientMessageId
              ? String(msg.clientMessageId)
              : null;

            console.log(
              normalizedMsgId,
              normalizedTargetId,
              normalizedClientId
            );

            const matches =
              normalizedMsgId === normalizedTargetId ||
              normalizedClientId === normalizedTargetId ||
              normalizedClientId === normalizedMsgId;

            if (matches) {
              console.log("✅ Status updated:", {
                from: msg.status,
                to: status,
                messageId: normalizedMsgId,
              });
              return { ...msg, status };
            }
            return msg;
          });

          return {
            messages: {
              ...state.messages,
              [chatId]: updatedMessages,
            },
          };
        });
      },

      updateAllMessageStatus: (chatId, status) => {
        set((state) => {
          const msgs = (state.messages[chatId] || []).map((m) =>
            m.status === status ? m : { ...m, status }
          );
          return { messages: { ...state.messages, [chatId]: msgs } };
        });
      },

      // ----------------------------
      // 🔹 Update user online/offline status
      // ----------------------------

      updateUserStatus: (userId, statusData) => {
        set((state) => {
          // ✅ 1️⃣ Update chat list (sidebar)
          const updatedChats = state.chats.map((chat) => {
            const chatUserId =
              chat.userId?.toString() ||
              chat.user?._id?.toString() ||
              chat._id?.toString();

            if (chatUserId === userId?.toString()) {
              return {
                ...chat,
                user: {
                  ...(chat.user || chat),
                  onlineStatus: statusData.onlineStatus,
                  lastActiveDisplay:
                    statusData.lastActiveDisplay ??
                    chat.user?.lastActiveDisplay,
                },
                onlineStatus: statusData.onlineStatus,
                lastActiveDisplay:
                  statusData.lastActiveDisplay ?? chat.lastActiveDisplay,
              };
            }
            return chat;
          });

          // ✅ 2️⃣ Update selectedChat (main window)
          const selectedChatUserId =
            state.selectedChat?.userId?.toString() ||
            state.selectedChat?.user?._id?.toString();

          let updatedSelectedChat = state.selectedChat;
          let selectedChatChanged = false;

          if (selectedChatUserId === userId?.toString()) {
            updatedSelectedChat = {
              ...state.selectedChat,
              user: {
                ...(state.selectedChat.user || state.selectedChat),
                onlineStatus: statusData.onlineStatus,
                lastActiveDisplay:
                  statusData.lastActiveDisplay ??
                  state.selectedChat?.lastActiveDisplay,
              },
              onlineStatus: statusData.onlineStatus,
              lastActiveDisplay:
                statusData.lastActiveDisplay ??
                state.selectedChat?.lastActiveDisplay,
            };
            selectedChatChanged = true;
          } else {
          }

          const result = {
            chats: updatedChats,
            selectedChat: selectedChatChanged
              ? updatedSelectedChat
              : state.selectedChat,
          };

          return result;
        });
      },

      // ----------------------------
      // 🔹 Fetch chats with messages (fixed)
      // ----------------------------
      // In fetchAllChatsWithMessages:
      fetchAllChatsWithMessages: async () => {
        try {
          const res = await API.get(
            "/common/conversation/allchatswithmessages"
          );
          const { success, chats: chatData } = res.data;
          console.log(res);

          if (success && Array.isArray(chatData)) {
            const messagesObj = {}; // Only build messages

            for (const chat of chatData) {
              const chatId = chat.chatId;

              // Group messages by chatId, mark as history
              if (Array.isArray(chat.messages) && chat.messages.length > 0) {
                // 🆕 Use setMessages (merges with existing, dedups)
                const store = get(); // Access current store
                store.setMessages(
                  chatId,
                  chat.messages.map((m) => ({
                    ...m,
                    isHistory: true, // Avoid sound on load
                  }))
                );
              }
            }

            // ❌ REMOVE: No set({ chats: newChats }) – preserve full chats from fetchChatList
            console.log(
              "✅ Loaded messages for chats without overwriting chats list"
            );
          }
        } catch (err) {
          toast.error("Failed to fetch chats with messages: " + err.message);
        }
      },

      // inside useChatStore
      getUnreadCount: () => {
        const { messages, currentUserId } = get();
        const allMessages = Object.values(messages).flat();
        return allMessages.filter(
          (msg) =>
            (msg.status === "sent" || msg.status === "delivered") &&
            msg.receiverId?._id?.toString() === currentUserId?.toString()
        ).length;
      },

      // ----------------------------
      // 🔹 Fetch chat list (enhanced)
      // ----------------------------
      fetchChatList: async (showLoader = false) => {
        try {
          if (showLoader) set({ loading: true });
          const res = await API.get("/common/conversation/getChatList");
          const data = res.data;

          if (data?.success) {
            // 🔹 Sort chats by lastMessage.createdAt descending for consistency
            const sortedChats = (data.chats || []).sort(
              (a, b) =>
                new Date(b.lastMessage?.createdAt || 0) -
                new Date(a.lastMessage?.createdAt || 0)
            );

            set({ chats: sortedChats });
            console.log(sortedChats);
          }
        } catch (err) {
          console.error("fetchChatList error:", err);
        } finally {
          if (showLoader) set({ loading: false });
        }
      },

      // ----------------------------
      // 🔹 Clear all chat data
      // ----------------------------
      clearChatData: () =>
        set({
          chats: [],
          messages: {},
          selectedChat: null,
          loading: false,
          messageLoading: false,
        }),
    }),
    {
      name: "chat-storage",
      storage: memoryStorage,
    }
  )
);

export default useChatStore;
