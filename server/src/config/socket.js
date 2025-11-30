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
    } catch {
      return socket.disconnect();
    }

    socket.join(userId);

    try {
      // Fetch profile (lean for speed)
      const Model = role_type === "job-seeker" ? User : Recruiter;
      const profile = await Model.findById(userId).lean();

      if (profile) {
        // Update activity (DB write)
        await Model.updateOne(
          { _id: userId },
          {
            $set: {
              onlineStatus: "online",
              lastActive: new Date(),
              lastActiveDisplay: profile.lastActiveDisplay,
            },
          }
        );

        // Broadcast online status
        const statusPayload = {
          _id: profile._id,
          onlineStatus: "online",
          lastActiveDisplay: profile.lastActiveDisplay,
        };

        chatNamespace.emit("userStatusUpdate", statusPayload);
        statusNamespace.emit("userStatusUpdate", statusPayload);

        // =========================
        //  Mark Messages as Delivered (Optimized)
        // =========================
        const chats = await Chat.find(
          {
            "messages.receiverId": userObjectId,
            "messages.status": "sent",
          },
          {
            _id: 1,
            members: 1,
            messages: 1,
          }
        ).lean();

        for (const chat of chats) {
          const deliveredIds = chat.messages
            .filter(
              (m) => m.receiverId?.toString() === userId && m.status === "sent"
            )
            .map((m) => m._id.toString());

          // Atomic update – no rewriting whole messages array
          await Chat.updateOne(
            { _id: chat._id },
            {
              $set: { "messages.$[elem].status": "delivered" },
            },
            {
              arrayFilters: [
                { "elem.receiverId": userObjectId, "elem.status": "sent" },
              ],
            }
          );

          // Notify senders
          for (const member of chat.members) {
            const senderId = member.userId.toString();
            if (senderId !== userId) {
              chatNamespace.to(senderId).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: deliveredIds,
                status: "delivered",
              });
              statusNamespace.to(senderId).emit("messageStatusUpdate", {
                chatId: chat._id.toString(),
                messageIds: deliveredIds,
                status: "delivered",
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Error setting online:", err);
    }

    // =========================
    // 🔻 Handle Disconnect
    // =========================
    socket.on("disconnect", async () => {
      try {
        const Model = role_type === "job-seeker" ? User : Recruiter;
        const now = new Date();

        await Model.updateOne(
          { _id: userId },
          {
            $set: {
              onlineStatus: "offline",
              lastActive: now,
              lastActiveDisplay: now.toLocaleString("en-US"),
            },
          }
        );

        const payload = {
          _id: userId,
          onlineStatus: "offline",
          lastActiveDisplay: now.toLocaleString("en-US"),
        };

        chatNamespace.emit("userStatusUpdate", payload);
        statusNamespace.emit("userStatusUpdate", payload);
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });

  // =========================
  // 🔹 Chat Namespace
  // =========================
  chatNamespace.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) return socket.disconnect();
    socket.join(userId);

    // =========================
    //  Send Message
    // =========================
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

      // Atomic write (do not load entire chat)
      await Chat.updateOne(
        { _id: chatId },
        { $push: { messages: message }, $set: { lastMessage: message } }
      );

      chatNamespace.to(receiverId).emit("receiveMessage", { chatId, message });
      chatNamespace.to(senderId).emit("messageSent", { chatId, message });

      // Fast check if receiver is online
      const receiverOnline = chatNamespace.adapter.rooms.has(receiverId);

      if (receiverOnline) {
        await Chat.updateOne(
          {
            _id: chatId,
            "messages.receiverId": receiverId,
            "messages.status": "sent",
          },
          {
            $set: { "messages.$[elem].status": "delivered" },
          },
          {
            arrayFilters: [
              {
                "elem.receiverId": new mongoose.Types.ObjectId(receiverId),
                "elem.status": "sent",
              },
            ],
          }
        );

        chatNamespace.to(senderId).emit("messageStatusUpdate", {
          chatId,
          messageIds: [], // frontend stays same
          status: "delivered",
        });
      }
    });

    // =========================
    //  Mark Seen
    // =========================
    socket.on("markSeen", async ({ chatId, receiverId }) => {
      try {
        const result = await Chat.findOneAndUpdate(
          {
            _id: chatId,
            "messages.receiverId": receiverId,
            "messages.status": "delivered",
          },
          {
            $set: {
              "messages.$[elem].status": "seen",
            },
          },
          {
            arrayFilters: [
              {
                "elem.receiverId": new mongoose.Types.ObjectId(receiverId),
                "elem.status": "delivered",
              },
            ],
            new: true,
            projection: { messages: 1, members: 1 },
          }
        ).lean();

        if (!result) return;

        const seenMsgIds = result.messages
          .filter(
            (m) =>
              m.receiverId?.toString() === receiverId && m.status === "seen"
          )
          .map((m) => m._id.toString());

        for (const member of result.members) {
          const memberId = member.userId.toString();
          if (memberId !== receiverId) {
            chatNamespace.to(memberId).emit("messageStatusUpdate", {
              chatId,
              messageIds: seenMsgIds,
              status: "seen",
            });
            statusNamespace.to(memberId).emit("messageStatusUpdate", {
              chatId,
              messageIds: seenMsgIds,
              status: "seen",
            });
          }
        }
      } catch (err) {
        console.error("markSeen error:", err);
      }
    });
  });
}

module.exports = { setupSocket };
