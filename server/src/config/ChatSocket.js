// sockets/chat_Socket.js
const User = require("../models/UserModel");
const Recruiter = require("../models/RecruiterModel");
const Chat = require("../models/Chat");

/**
 * Chat namespace: handles sendMessage, markAsSeen, delivery on connect, typing indicators
 */
function chat_Socket(io) {
  const chatNamespace = io.of("/Chat");

  chatNamespace.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    const role_type = socket.handshake.query.role_type;

    if (!userId || !role_type) {
      return socket.disconnect();
    }

    socket.data = socket.data || {}; // Initialize socket data
    socket.data.openChats = []; // Track open chats for this session

    socket.join(userId); // personal room

    // Send profile/status to self and broadcast online to others
    try {
      let profile = null;
      if (role_type === "job-seeker") {
        profile = await User.findById(userId).select(
          "name image onlineStatus lastActiveDisplay"
        );
      } else {
        profile = await Recruiter.findById(userId).select(
          "name image onlineStatus lastActiveDisplay"
        );
      }

      if (profile) {
        // emit to self
        socket.emit("profileStatus", {
          _id: profile._id,
          name: profile.name,
          onlineStatus: "online",
          lastActiveDisplay: profile.lastActiveDisplay,
          image: profile.image,
        });

        // notify others
        socket.broadcast.emit("userStatusUpdate", {
          _id: profile._id,
          onlineStatus: "online",
          lastActiveDisplay: profile.lastActiveDisplay,
        });
      }

      // MARK PENDING SENT -> DELIVERED for messages targeted to this user
      // Find chats where this user is a member and there are messages with status 'sent'
      const chats = await Chat.find({
        "members.userId": userId,
        "messages.status": "sent",
      });

      for (const chat of chats) {
        let changedMessageIds = [];

        chat.messages.forEach((msg) => {
          // if message was 'sent' and this user is the receiver (or senderId != userId)
          // Option 1: if you stored receiverId in msg, prefer that; otherwise infer.
          const isReceiver = msg.receiverId
            ? msg.receiverId && msg.receiverId.toString() === userId.toString()
            : msg.senderId.toString() !== userId.toString();
          if (msg.status === "sent" && isReceiver) {
            msg.status = "delivered";
            changedMessageIds.push(msg._id.toString());
          }
        });

        if (changedMessageIds.length > 0) {
          await chat.save();

          // Notify senders (all other members) that messages were delivered
          chat.members.forEach((member) => {
            const memberIdStr = member.userId.toString();
            if (memberIdStr !== userId.toString()) {
              chatNamespace.to(memberIdStr).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: changedMessageIds,
                status: "delivered",
              });
            }
          });
        }
      }
    } catch (err) {}

    socket.on("closeChat", ({ chatId, viewerId }) => {
      try {
        if (!chatId || !viewerId) return;
        if (Array.isArray(socket.data.openChats)) {
          socket.data.openChats = socket.data.openChats.filter(
            (id) => id.toString() !== chatId.toString()
          );
        }
        console.log(`🚪 Chat closed: ${chatId} by ${viewerId}`);
      } catch (err) {
        console.error("Error in closeChat:", err);
      }
    });

    // -------- openChat: Track open chats ----------
    socket.on("openChat", async ({ chatId, viewerId }) => {
      try {
        if (!chatId || !viewerId) return;

        // 🔄 NEW: Track this chat as open for this socket/session
        if (!socket.data.openChats.includes(chatId)) {
          socket.data.openChats.push(chatId);
        }

        console.log(socket.data.openChats);

        // Fetch only messages that need update (read)
        const chat = await Chat.findById(chatId).select("messages members");
        if (!chat) return;

        const changedIds = chat.messages
          .filter(
            (m) =>
              m.receiverId?.toString() === viewerId.toString() &&
              m.status !== "read"
          )
          .map((m) => m._id.toString());

        if (changedIds.length === 0) return;

        const lastReadId = changedIds[changedIds.length - 1];

        // ✅ Use updateOne with arrayFilters (atomic update)
        await Chat.updateOne(
          { _id: chatId },
          {
            $set: {
              "messages.$[msg].status": "read",
              "members.$[mem].lastReadMessageId": lastReadId,
            },
          },
          {
            arrayFilters: [
              { "msg._id": { $in: changedIds } },
              { "mem.userId": viewerId },
            ],
          }
        );

        // Notify all chat members
        chat.members.forEach((member) => {
          chatNamespace
            .to(member.userId.toString())
            .emit("messageStatusUpdate", {
              chatId: chatId.toString(),
              messageIds: changedIds,
              status: "read",
            });
        });
      } catch (err) {}
    });

    socket.on("sendMessage", async (data) => {
      try {
        const {
          chatId,
          senderId,
          senderModel = "User",
          receiverId,
          receiverModel,
          content,
          media = [],
          clientMessageId,
        } = data;

        if (!chatId || !senderId || (!content && media.length === 0)) return;

        // 🟢 Step 1: Create new message (with clientMessageId)
        const newMessage = {
          senderId,
          senderModel,
          receiverId,
          receiverModel,
          content,
          media,
          status: "sent",
          createdAt: new Date(),
          clientMessageId, // from frontend for optimistic tracking
        };

        // 🟢 Step 2: Save message to chat document
        const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: newMessage },
            $set: { lastMessage: newMessage },
          },
          { new: true, select: "messages members" }
        );

        if (!updatedChat) return;

        const savedMessage =
          updatedChat.messages[updatedChat.messages.length - 1].toObject();

        // 🟢 Step 3: Fetch sender profile details
        let senderProfile = null;
        if (senderModel === "User") {
          senderProfile = await User.findById(senderId).select(
            "name image onlineStatus lastActiveDisplay"
          );
        } else {
          senderProfile = await Recruiter.findById(senderId).select(
            "name image onlineStatus lastActiveDisplay"
          );
        }

        // 🟢 Step 4: Enriched message object
        const enrichedMessage = {
          ...savedMessage,
          clientMessageId, // ensure frontend matches optimistic message
          sender: senderProfile
            ? {
                _id: senderProfile._id,
                name: senderProfile.name,
                image: senderProfile.image,
                onlineStatus: senderProfile.onlineStatus || "offline",
                lastActiveDisplay: senderProfile.lastActiveDisplay,
                model: senderModel,
              }
            : null,
        };

        // 🟢 Step 5: Build chat response object (for chat list)
        const chatResponse = {
          _id: chatId.toString(),
          type: "private",
          name: senderProfile?.name || "Unknown",
          avatar: senderProfile?.image || null,
          onlineStatus: senderProfile?.onlineStatus || "offline",
          lastActiveDisplay: senderProfile?.lastActiveDisplay || null,
          lastMessage: {
            content: savedMessage.content,
            media: savedMessage.media || [],
            createdAt: savedMessage.createdAt,
            status: savedMessage.status,
          },
          updatedAt: savedMessage.createdAt,
          userId: senderProfile?._id?.toString(),
        };

        // 🟢 Step 6: Emit new message to all members (sender + receiver)
        updatedChat.members.forEach((m) => {
          chatNamespace.to(m.userId.toString()).emit("receiveMessage", {
            chat: chatResponse,
            chatId: chatId.toString(),
            message: enrichedMessage,
          });
        });

        // 🟢 Step 7: Determine delivery/read status for receiver
        let finalStatus = "sent";

        const allSockets = Array.from(chatNamespace.sockets.values());

        // Find if receiver has any active sockets
        const receiverSocket = allSockets.find(
          (s) => s.handshake.query.userId === receiverId?.toString()
        );

        // Check if any receiver socket currently has this chat open
        const receiverHasChatOpen = allSockets.some(
          (s) =>
            s.handshake.query.userId === receiverId?.toString() &&
            Array.isArray(s.data.openChats) &&
            s.data.openChats.includes(chatId.toString())
        );

        if (receiverSocket) {
          finalStatus = receiverHasChatOpen ? "read" : "delivered";

          // Update DB with new status if applicable
          await Chat.updateOne(
            { _id: chatId, "messages._id": savedMessage._id },
            { $set: { "messages.$.status": finalStatus } }
          );

          // Notify both sender & receiver of status change
          updatedChat.members.forEach((m) => {
            chatNamespace.to(m.userId.toString()).emit("messageStatusUpdate", {
              chatId: chatId.toString(),
              messageIds: [savedMessage._id.toString()],
              status: finalStatus,
            });
          });
        }

        // 🟢 Step 8: Confirm back to sender with actual DB message ID + status
        enrichedMessage.status = finalStatus;
        chatNamespace.to(senderId.toString()).emit("messageSent", {
          chat: chatResponse,
          chatId: chatId.toString(),
          message: enrichedMessage,
        });
      } catch (err) {
        console.error("❌ Error in sendMessage:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // -------- mark as seen (client emits when user opens the chat) ----------
    socket.on("markAsSeen", async ({ chatId, userId: viewerId }) => {
      try {
        if (!chatId || !viewerId) return;

        const chat = await Chat.findById(chatId).select("messages members");
        if (!chat) return;

        const changedIds = chat.messages
          .filter(
            (msg) =>
              msg.receiverId?.toString() === viewerId.toString() &&
              msg.status !== "read"
          )
          .map((m) => m._id.toString());

        if (changedIds.length === 0) return;

        await Chat.updateOne(
          { _id: chatId },
          { $set: { "messages.$[msg].status": "read" } },
          { arrayFilters: [{ "msg._id": { $in: changedIds } }] }
        );

        chat.members.forEach((member) => {
          if (member.userId.toString() !== viewerId.toString()) {
            chatNamespace
              .to(member.userId.toString())
              .emit("messageStatusUpdate", {
                chatId: chatId.toString(),
                messageIds: changedIds,
                status: "read",
              });
          }
        });
      } catch (err) {}
    });

    // -------- typing indicators ----------
    socket.on("typing", ({ receiverId, senderId }) => {
      if (receiverId) chatNamespace.to(receiverId).emit("typing", { senderId });
    });

    socket.on("stopTyping", ({ receiverId, senderId }) => {
      if (receiverId)
        chatNamespace.to(receiverId).emit("stopTyping", { senderId });
    });

    // -------- disconnect ----------
    socket.on("disconnect", async () => {
      // 🔄 NEW: Clean up openChats (optional)
      socket.data.openChats = [];
      // broadcast offline - you may want to update DB separately via /UserStatus namespace
      socket.broadcast.emit("userStatusUpdate", {
        _id: userId,
        onlineStatus: "offline",
      });
    });
  });
}

module.exports = { chat_Socket };
