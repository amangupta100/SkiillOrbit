const User = require("../models/UserModel");
const Recruiter = require("../models/RecruiterModel");
const Chat = require("../models/Chat");
const mongoose = require("mongoose");

function setupSocket(io) {
  const statusNamespace = io.of("/UserStatus");
  const chatNamespace = io.of("/Chat");

  // =========================
  // 🔹 UserStatus Namespace
  // =========================
  statusNamespace.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    const role_type = socket.handshake.query.role_type;

    if (!userId || !role_type) return socket.disconnect();

    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      console.error("Invalid userId:", err);
      return socket.disconnect();
    }

    // Join personal room
    socket.join(userId);

    try {
      // ✅ Fetch and mark online
      const profile =
        role_type === "job-seeker"
          ? await User.findById(userId)
          : await Recruiter.findById(userId);

      if (profile) {
        profile.onlineStatus = "online";
        await profile.updateActivity?.();

        // ✅ Notify others that this user is online
        chatNamespace.emit("userStatusUpdate", {
          _id: profile._id,
          onlineStatus: "online",
          lastActiveDisplay: profile.lastActiveDisplay,
        });
        statusNamespace.emit("userStatusUpdate", {
          _id: profile._id,
          onlineStatus: "online",
          lastActiveDisplay: profile.lastActiveDisplay,
        });

        // ✅ Mark all "sent" messages as delivered
        const affectedChats = await Chat.find({
          messages: {
            $elemMatch: {
              receiverId: userObjectId,
              status: "sent",
            },
          },
        });

        for (const chat of affectedChats) {
          const deliveredMsgIds = [];

          chat.messages.forEach((msg) => {
            if (
              msg.receiverId?.toString() === userId.toString() &&
              msg.status === "sent"
            ) {
              msg.status = "delivered";
              deliveredMsgIds.push(msg._id.toString());
            }
          });

          if (deliveredMsgIds.length > 0) {
            await chat.save();

            // Notify all other members (senders)
            (chat.members || []).forEach((member) => {
              const memberId = member.userId?.toString();
              if (memberId && memberId !== userId.toString()) {
                chatNamespace.to(memberId).emit("messageStatusUpdate", {
                  chatId: chat._id.toString(),
                  messageIds: deliveredMsgIds,
                  status: "delivered",
                });
                statusNamespace.to(memberId).emit("messageStatusUpdate", {
                  chatId: chat._id.toString(),
                  messageIds: deliveredMsgIds,
                  status: "delivered",
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Error setting online status:", err);
    }

    // 🔻 Handle disconnect (offline)
    socket.on("disconnect", async () => {
      try {
        const profile =
          role_type === "job-seeker"
            ? await User.findById(userId)
            : await Recruiter.findById(userId);

        if (profile) {
          await profile.markOffline?.();

          chatNamespace.emit("userStatusUpdate", {
            _id: profile._id,
            onlineStatus: "offline",
            lastActiveDisplay: profile.lastActiveDisplay,
          });
          statusNamespace.emit("userStatusUpdate", {
            _id: profile._id,
            onlineStatus: "offline",
            lastActiveDisplay: profile.lastActiveDisplay,
          });
        }
      } catch (err) {
        console.error("Error on disconnect:", err);
      }
    });
  });

  // =========================
  // 🔹 Chat Namespace
  // =========================
  chatNamespace.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    const role_type = socket.handshake.query.role_type;

    if (!userId) return socket.disconnect();
    socket.join(userId); // join personal room

    // ✅ Send Message
    socket.on("sendMessage", async (data) => {
      const {
        chatId,
        senderId,
        receiverId,
        content,
        media = [],
        senderModel,
      } = data;

      if (!chatId || !senderId || !receiverId || !content) return;

      const message = {
        senderId,
        receiverId,
        senderModel,
        content,
        media,
        status: "sent",
        createdAt: new Date(),
      };

      const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { messages: message },
          $set: { lastMessage: message },
        },
        { new: true }
      );

      chatNamespace.to(receiverId).emit("receiveMessage", { chatId, message });
      chatNamespace.to(senderId).emit("messageSent", { chatId, message });

      // ✅ If receiver is online, mark as delivered immediately
      const receiverSocket = [...chatNamespace.sockets.values()].find(
        (s) => s.handshake.query.userId === receiverId
      );

      if (receiverSocket) {
        const msgToUpdate = chat.messages.find(
          (m) =>
            m.receiverId?.toString() === receiverId.toString() &&
            m.content === content &&
            m.status === "sent"
        );
        if (msgToUpdate) {
          msgToUpdate.status = "delivered";
          await chat.save();

          (chat.members || []).forEach((member) => {
            const memberId = member.userId?.toString();
            if (memberId && memberId !== receiverId.toString()) {
              chatNamespace.to(memberId).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: [msgToUpdate._id.toString()],
                status: "delivered",
              });
              statusNamespace.to(memberId).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: [msgToUpdate._id.toString()],
                status: "delivered",
              });
            }
          });
        }
      }
    });

    // ✅ Mark Messages as Seen
    socket.on("markSeen", async ({ chatId, receiverId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const seenMsgIds = [];

        chat.messages.forEach((msg) => {
          if (
            msg.receiverId?.toString() === receiverId.toString() &&
            msg.status === "delivered"
          ) {
            msg.status = "seen";
            seenMsgIds.push(msg._id.toString());
          }
        });

        if (seenMsgIds.length > 0) {
          await chat.save();

          (chat.members || []).forEach((member) => {
            const memberId = member.userId?.toString();
            if (memberId && memberId !== receiverId.toString()) {
              chatNamespace.to(memberId).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: seenMsgIds,
                status: "seen",
              });
              statusNamespace.to(memberId).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: seenMsgIds,
                status: "seen",
              });
            }
          });
        }
      } catch (err) {
        console.error("markSeen error:", err);
      }
    });
  });
}

module.exports = { setupSocket };
