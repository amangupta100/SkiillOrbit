"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatSidebar from "../../../components/common/ChatSidebar";
import useChatStore from "@/store/recruiter/ChatStore";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import useChatSocket from "@/lib/common/ChatSocket";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa6";
import useAuthStore from "@/store/authStore";
import API from "@/utils/interceptor";
import ButtonLoader from "@/utils/Loader";
import { Skeleton } from "@/components/ui/skeleton";
import { FaCheck, FaCheckDouble } from "react-icons/fa6";
import Image from "next/image";
import empty from "@/assests/empty.svg";
import { IoMdClose } from "react-icons/io";

const ChatPage = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState([]);
  const { recruiter } = useRecruiterAuthStore();
  const { user } = useAuthStore();
  const { selectedChat, messages, setSelectedChat, messageLoading } =
    useChatStore();

  const { sendMessage, openChat, closeChat } = useChatSocket({
    userId: recruiter?.id,
    role_type: recruiter ? "recruiter" : "job-seeker",
  });

  const pingAudio = useRef(null);

  useEffect(() => {
    pingAudio.current = new Audio("/ping_sound_effect.mp3");
    pingAudio.current.volume = 0.2; // optional volume control
  }, []);

  const chatMessages = messages[selectedChat?._id] || [];

  // 🟢 Send message handler
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !attachedMedia?.length) || !selectedChat) return;
    setIsSending(true);

    let chatId = selectedChat._id;
    let clientMessageId = null;

    console.log(selectedChat);

    try {
      const store = useChatStore.getState();

      // 🟢 If it's a temp chat (first ever message)
      if (chatId?.startsWith?.("temp_")) {
        const { data } = await API.post(
          "/common/conversation/get&CreateConversation",
          {
            senderId: recruiter?.id, // Or recruiter?.id
            senderModel: recruiter ? "Recruiter" : "User",
            receiverId: selectedChat.userId,
            content: inputValue.trim(),
            media: attachedMedia || [],
          }
        );

        if (data?.success) {
          chatId = data.chatId;
          store.setSelectedChat({ ...selectedChat, _id: chatId });

          // 🆕 NEW: Notification-only emit (no re-insert)
          const savedMessage = data.lastMessage; // Assume API returns full message with _id
          const notifyData = {
            chatId,
            messageId: savedMessage._id, // Real server ID
            senderId: recruiter?.id,
            senderModel: recruiter ? "Recruiter" : "User",
            receiverId: selectedChat.userId,
            receiverModel: "User",
            content: inputValue.trim(),
            media: attachedMedia || [],
            skipInsert: true, // Flag for backend
          };
          clientMessageId = sendMessage(notifyData); // Uses same function, but backend skips push

          // 🆕 Optimistic: Add using savedMessage (no clientId dupe risk)
          store.addMessage(chatId, {
            ...savedMessage,
            isMine: true,
            // status already "sent" from API
          });

          // Update chats, sound, clear input
          const updatedChats = store.chats.map((chat) =>
            chat._id === chatId
              ? {
                  ...chat,
                  lastMessage: {
                    content: inputValue.trim(),
                    media: attachedMedia || [],
                    createdAt: new Date(),
                  },
                  updatedAt: new Date(),
                }
              : chat
          );
          store.setChats(updatedChats);

          if (pingAudio.current) pingAudio.current.play().catch(() => {});
          setInputValue("");
          setAttachedMedia([]);
          setIsSending(false);
          return; // Skip the non-temp block
        } else {
          // Error handling...
          setIsSending(false);
          return;
        }
      }

      // Build message payload
      const messageData = {
        chatId,
        senderId: recruiter?.id,
        senderModel: recruiter ? "Recruiter" : "User",
        receiverId: selectedChat.userId,
        receiverModel: "User",
        content: inputValue.trim(),
        media: attachedMedia || [],
      };

      // 🟢 Emit via socket
      clientMessageId = sendMessage(messageData);

      // 🟢 Optimistic UI update
      store.addMessage(chatId, {
        ...messageData,
        _id: clientMessageId,
        clientMessageId,
        isMine: true,
        status: "sent",
        createdAt: new Date(),
      });

      // 🟢 Update chat list (last message only)
      const updatedChats = store.chats.map((chat) =>
        chat._id === chatId
          ? {
              ...chat,
              lastMessage: {
                content: inputValue.trim(),
                media: attachedMedia || [],
                createdAt: new Date(),
              },
              updatedAt: new Date(),
            }
          : chat
      );
      store.setChats(updatedChats);

      // Ping sound
      if (pingAudio.current) {
        pingAudio.current.currentTime = 0.2;
        pingAudio.current.play().catch(() => {});
      }

      setInputValue("");
      setAttachedMedia([]);
    } catch (err) {
      console.log("❌ Error sending message:", err?.message || err);
      const store = useChatStore.getState();
      if (chatId && clientMessageId) {
        store.updateMessageStatus(chatId, clientMessageId, "failed");
      }
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!selectedChat?._id) return;
    const store = useChatStore.getState();
    const existingMsgs = store.messages[selectedChat._id] || [];
    // 🆕 Better guard: Skip if recent activity (e.g., <5min old) or has messages
    const isRecent =
      new Date(selectedChat.updatedAt) > new Date(Date.now() - 5 * 60 * 1000);
    if (existingMsgs.length === 0 && !isRecent) {
      // Fetch only for truly empty/old chats
      store.fetchAllChatsWithMessages();
    } else {
      console.log(
        "⏭️ Skipping fetch: Recent or has",
        existingMsgs.length,
        "messages"
      );
    }
    openChat({ chatId: selectedChat._id, viewerId: user?.id || recruiter?.id }); // Fix: Use correct ID
  }, [selectedChat?._id]);

  console.log(selectedChat);
  console.log(messages);

  // In ChatPage or parent useEffect([], ...):
  useEffect(() => {
    const store = useChatStore.getState();
    if (store.chats.length === 0) {
      store.fetchChatList(true); // Load full list first
    }
  }, []);

  // 🔹 Send message on Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && inputValue.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          selectedChat ? "hidden md:block" : "block"
        } w-full md:w-[320px] lg:w-[380px] border-r bg-white`}
      >
        <ChatSidebar />
      </div>

      {/* Chat Window */}
      <div
        className={`flex flex-col flex-1 overflow-hidden ${
          selectedChat ? "block" : "hidden md:block"
        }`}
      >
        {!selectedChat ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Image
              onDragStart={(e) => e.preventDefault()}
              src={empty}
              alt="No Chat Selected"
              className="w-[450px] h-[450px] mb-4"
            />
            <h1 className="text-lg text-zinc-400">
              Select a chat to start messaging
            </h1>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-2 flex justify-between items-center border-b border-zinc-200 bg-white">
              {/* 🔹 Left side (arrow + avatar + name) */}
              <div className="flex items-center gap-3">
                {/* Back button */}
                <FaArrowLeft
                  className="cursor-pointer block md:hidden"
                  onClick={() => {
                    if (selectedChat?._id) {
                      const viewerId = user?.id || recruiter?.id;
                      closeChat({ chatId: selectedChat._id, viewerId });
                    }
                    setSelectedChat(null);
                  }}
                />

                {/* Avatar */}
                <div className="relative w-12 h-12">
                  <div className="w-full h-full rounded-full border border-zinc-200 overflow-hidden">
                    {selectedChat?.avatar?.data ? (
                      <img
                        src={selectedChat.avatar.data}
                        alt="User Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-semibold rounded-full">
                        {selectedChat?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>

                  {/* ✅ Online dot outside the circle */}
                  {selectedChat?.onlineStatus === "online" && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>

                {/* Name + Status */}
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold leading-tight">
                    {selectedChat?.name}
                  </h1>
                  <h2 className="text-sm text-gray-500">
                    {selectedChat?.onlineStatus === "online"
                      ? "Online"
                      : `Last seen ${
                          selectedChat?.lastActiveDisplay || "recently"
                        }`}
                  </h2>
                </div>
              </div>

              {/* 🔹 Right side (close button) */}
              <IoMdClose
                className="cursor-pointer text-gray-600 text-2xl hover:text-red-500"
                onClick={() => {
                  if (selectedChat?._id) {
                    const viewerId = user?.id || recruiter?.id;
                    closeChat({ chatId: selectedChat._id, viewerId });
                  }
                  setSelectedChat(null);
                }}
              />
            </div>

            {/* Messages Section */}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {(() => {
                if (messageLoading) {
                  return (
                    <div className="p-4 space-y-4">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 ${
                            i % 2 === 0 ? "justify-start" : "justify-end"
                          }`}
                        >
                          {i % 2 === 0 && (
                            <Skeleton className="w-8 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                          )}
                          <Skeleton className="h-9 w-[60%] rounded-lg bg-gray-300 dark:bg-gray-600" />
                        </div>
                      ))}
                    </div>
                  );
                }

                if (chatMessages.length === 0) {
                  return (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                      No messages yet. Start the conversation!
                    </div>
                  );
                }

                // 🧠 Helper functions
                const isSameDay = (d1, d2) =>
                  d1.getFullYear() === d2.getFullYear() &&
                  d1.getMonth() === d2.getMonth() &&
                  d1.getDate() === d2.getDate();

                const formatDayLabel = (date) => {
                  const now = new Date();
                  if (isSameDay(date, now)) return "Today";

                  const yesterday = new Date();
                  yesterday.setDate(now.getDate() - 1);
                  if (isSameDay(date, yesterday)) return "Yesterday";

                  return date.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year:
                      now.getFullYear() === date.getFullYear()
                        ? undefined
                        : "numeric",
                  });
                };

                let lastDate = null;

                return chatMessages.map((msg, idx) => {
                  const currentUserId = recruiter?.id || user?.id;
                  const isMine =
                    msg.isMine || msg.senderId?._id === currentUserId;

                  const msgDate = new Date(msg.createdAt);
                  const showDateSeparator =
                    !lastDate || !isSameDay(msgDate, new Date(lastDate));

                  if (showDateSeparator) lastDate = msgDate;

                  const getTickIcon = () => {
                    if (!isMine) return null;
                    switch (msg.status) {
                      case "sent":
                        return (
                          <FaCheck className="text-gray-200 ml-1" size={10} />
                        );
                      case "delivered":
                        return (
                          <FaCheckDouble
                            className="text-gray-200 ml-1"
                            size={11}
                          />
                        );
                      case "read":
                        return (
                          <FaCheckDouble
                            className="text-blue-500 ml-1"
                            size={11}
                          />
                        );
                      default:
                        return (
                          <FaCheck className="text-gray-400 ml-1" size={11} />
                        );
                    }
                  };

                  return (
                    <React.Fragment key={idx}>
                      {showDateSeparator && (
                        <div className="text-center my-4">
                          <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                            {formatDayLabel(msgDate)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-lg shadow-sm max-w-xs break-words ${
                          isMine
                            ? "self-end bg-gray-400/95 text-white ml-auto"
                            : "self-start bg-white"
                        }`}
                      >
                        <div>{msg.content || msg.text}</div>
                        <div
                          className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${
                            isMine ? "text-gray-200" : "text-gray-400"
                          }`}
                        >
                          {msgDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {getTickIcon()}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            </div>

            {/* Input Section */}
            <div className="px-4 py-2 border-t bg-white flex gap-2 items-center">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-gray-400"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending}
                className={`p-3 rounded-lg transition-all flex items-center justify-center min-w-[45px] ${
                  inputValue.trim() && !isSending
                    ? "bg-gray-800 text-white hover:bg-gray-900"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSending ? (
                  <ButtonLoader color="white" text="Sending..." />
                ) : (
                  <FaPaperPlane className="w-5 h-5" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
