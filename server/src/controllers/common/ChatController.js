const Chat = require("../../models/Chat");
// controllers/searchApplicantsController.js
const Application = require("../../models/ApplicationModel");
const Job = require("../../models/JobModel");
const Internship = require("../../models/InternshipModel");
const User = require("../../models/UserModel"); // assuming you have a User model

const searchApplicants = async (req, res) => {
  try {
    const { id: userId } = req?.recruiter || req?.user;
    const { query = "" } = req.query;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const searchRegex = new RegExp(query, "i");

    // 1️⃣ Find recruiter's jobs + internships
    const [jobs, internships] = await Promise.all([
      Job.find({ createdBy: req?.recruiter.id }).select("_id role domain"),
      Internship.find({ createdBy: req?.recruiter.id }).select(
        "_id role domain"
      ),
    ]);

    const jobIds = jobs.map((j) => j._id);
    const internshipIds = internships.map((i) => i._id);

    // 2️⃣ Find all applications related to those postings
    const applications = await Application.find({
      $or: [{ job: { $in: jobIds } }, { internship: { $in: internshipIds } }],
    })
      .populate(
        "user",
        "name email resumeUrl skills image lastActiveDisplay onlineStatus"
      )
      .populate("job", "role domain")
      .populate("internship", "role domain")
      .lean();

    // 3️⃣ Filter by applicant name, email, or posting name
    const filtered = applications.filter((app) => {
      const user = app.user || {};
      const posting = app.job || app.internship || { role: "", domain: "" };

      return (
        user.name?.match(searchRegex) ||
        user.email?.match(searchRegex) ||
        posting.role?.match(searchRegex) ||
        posting.domain?.match(searchRegex)
      );
    });

    // 4️⃣ Deduplicate applicants by user._id
    const uniqueApplicantsMap = new Map();
    for (const app of filtered) {
      if (app.user?._id && !uniqueApplicantsMap.has(app.user._id.toString())) {
        uniqueApplicantsMap.set(app.user._id.toString(), app);
      }
    }

    const uniqueApplicants = Array.from(uniqueApplicantsMap.values());

    res.json({
      success: true,
      count: uniqueApplicants.length,
      applicants: uniqueApplicants,
    });
  } catch (err) {
    console.error("Search applicants error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while searching applicants",
    });
  }
};

const getChatList = async (req, res) => {
  try {
    const { id: userId } = req.recruiter || req.user;
    const roleType = req.recruiter ? "Recruiter" : "User";

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 🟢 Fetch all chats where the current user is a member
    const chats = await Chat.find({
      "members.userId": userId,
    })
      .populate({
        path: "members.userId",
        select: "name image onlineStatus _id lastActiveDisplay",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "name image onlineStatus lastActiveDisplay",
      })
      .sort({ updatedAt: -1 })
      .lean();

    // 🧩 Format — remove the requester and only keep other participant(s)
    const chatList = chats.map((chat) => {
      const isPrivate = chat.type === "private";

      // Exclude current user from members
      const otherMembers = chat.members.filter(
        (m) => m.userId && m.userId._id.toString() !== userId.toString()
      );

      // For private chats, there’s only one receiver
      const receiver = isPrivate ? otherMembers[0] : null;

      return {
        _id: chat._id,
        type: chat.type,

        // 🧠 Show receiver name for private, or group name
        name:
          isPrivate && receiver
            ? receiver.userId?.name || "Unknown User"
            : chat.name || "Group Chat",

        userId: isPrivate && receiver ? receiver.userId?._id : null,

        // 🖼️ Avatar (receiver’s image or group avatar)
        avatar: isPrivate
          ? receiver?.userId?.image || null
          : chat.avatar || null,

        // 🗨️ Last message info
        lastMessage: chat.lastMessage
          ? {
              content: chat.lastMessage.content || null,
              createdAt: chat.lastMessage.createdAt || null,
              sender: chat.lastMessage.senderId
                ? {
                    _id: chat.lastMessage.senderId._id,
                    name: chat.lastMessage.senderId.name,
                  }
                : null,
            }
          : null,

        // ⏱️ Timestamps and status
        updatedAt: chat.updatedAt,
        onlineStatus: receiver?.userId?.onlineStatus || null,
        lastActiveDisplay: receiver?.userId?.lastActiveDisplay || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: chatList.length,
      chats: chatList,
    });
  } catch (err) {
    console.error("❌ Error fetching chat list:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching chat list",
    });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req?.user?.id || req?.recruiter?.id;

    if (!chatId || !currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // 🔹 Fetch chat + populate message user data
    const chat = await Chat.findById(chatId)
      .populate("messages.senderId", "name image")
      .populate(
        "messages.receiverId",
        "name image email onlineStatus lastActiveDisplay"
      )
      .lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // 🔹 Sort messages oldest → newest
    const sortedMessages = chat.messages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((msg) => ({
        ...msg,
        isSentByUser:
          msg.senderId?._id?.toString() === currentUserId.toString(),
        // just pass existing DB status (sent/delivered/seen)
        currentStatus: msg.status,
      }));

    // ✅ Respond with full message list as-is
    return res.status(200).json({
      success: true,
      chatId,
      total: sortedMessages.length,
      messages: sortedMessages,
    });
  } catch (error) {
    console.error("getChatMessages error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    });
  }
};

const createOrGetConversation = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      senderModel = "User",
      receiverModel = senderModel === "User" ? "Recruiter" : "User",
      content,
      media = [],
    } = req.body;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing sender or receiver ID" });
    }

    // 🔍 1️⃣ Find if a private chat already exists between both users
    let chat = await Chat.findOne({
      type: "private",
      "members.userId": { $all: [senderId, receiverId] },
    });

    // 🆕 2️⃣ Create new chat if none exists
    if (!chat) {
      chat = await Chat.create({
        type: "private",
        members: [
          { userId: senderId, userModel: senderModel, role: "member" },
          { userId: receiverId, userModel: receiverModel, role: "member" },
        ],
        createdBy: senderId,
        createdByModel: senderModel,
      });
    }

    // 💬 3️⃣ Create message if content or media provided
    let newMessage = null;

    if (content || (media && media.length > 0)) {
      newMessage = {
        senderId,
        senderModel,
        receiverId, // ✅ Save receiverId
        receiverModel, // ✅ Save receiverModel for refPath population
        content,
        media,
        status: "sent",
        createdAt: new Date(),
      };

      // Push message and update lastMessage + updatedAt
      chat = await Chat.findByIdAndUpdate(
        chat._id,
        {
          $push: { messages: newMessage },
          $set: {
            lastMessage: {
              senderId,
              senderModel,
              content,
              media,
              status: "sent",
              createdAt: new Date(),
            },
            updatedAt: new Date(),
          },
        },
        { new: true }
      )
        .populate({
          path: "members.userId",
          select: "name image onlineStatus lastActiveDisplay",
        })
        .populate({
          path: "messages.receiverId",
          select: "name image onlineStatus lastActiveDisplay",
        })
        .populate({
          path: "messages.senderId",
          select: "name image onlineStatus lastActiveDisplay",
        })
        .lean();
    }

    // ✅ 4️⃣ Return response
    return res.status(200).json({
      success: true,
      message: "Conversation created or updated successfully",
      chatId: chat._id,
      chat,
      lastMessage: chat?.lastMessage || newMessage,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error while creating chat" });
  }
};

const getAllChatsWithMessages = async (req, res) => {
  try {
    const { id: userId } = req.recruiter || req.user;
    const roleType = req.recruiter ? "Recruiter" : "User";

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 🔹 Fetch chats where the user is a member and has received at least one message
    const chats = await Chat.find({
      type: "private",
      "members.userId": userId,
      "messages.receiverId": userId, // ✅ Only chats where user is receiver
    })
      .populate({
        path: "members.userId",
        select: "name email image onlineStatus lastActiveDisplay",
      })
      .populate({
        path: "messages.senderId",
        select: "name image onlineStatus lastActiveDisplay",
      })
      .populate({
        path: "messages.receiverId",
        select: "name email image onlineStatus lastActiveDisplay",
      })
      .populate("lastMessage")
      .select("_id type name avatar members messages createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    // ✅ If no chats found, return empty response
    if (!chats || chats.length === 0) {
      return res.json({
        success: true,
        totalChats: 0,
        chats: [],
      });
    }

    // 🔹 Format chats similar to getChatList
    const chatList = chats
      .map((chat) => {
        const otherMember = chat.members.find(
          (m) => m.userId && m.userId._id.toString() !== userId.toString()
        );

        // 🔹 Filter only messages received by this user
        const receivedMessages = (chat.messages || [])
          .filter(
            (msg) =>
              msg.receiverId &&
              msg.receiverId._id?.toString() === userId.toString()
          )
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map((msg) => ({
            _id: msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            media: msg.media,
            status: msg.status,
            createdAt: msg.createdAt,
            senderModel: msg.senderModel,
            receiverModel: msg.receiverModel,
            isDeleted: msg.isDeleted,
            isPinned: msg.isPinned,
            reactions: msg.reactions,
            mentions: msg.mentions,
          }));

        // ✅ If no received messages, skip this chat
        if (receivedMessages.length === 0) return null;

        return {
          chatId: chat._id,
          name: otherMember?.userId?.name || chat.name || "Unknown User",
          avatar: otherMember?.userId?.image || chat.avatar || null,
          email: otherMember?.userId?.email || null,
          onlineStatus: otherMember?.userId?.onlineStatus || "offline",
          lastActiveDisplay: otherMember?.userId?.lastActiveDisplay || null,
          updatedAt: chat.updatedAt,
          lastMessage: chat.lastMessage || null,
          messages: receivedMessages,
          user: otherMember?.userId || null,
        };
      })
      .filter(Boolean); // remove nulls

    return res.status(200).json({
      success: true,
      totalChats: chatList.length,
      chats: chatList,
    });
  } catch (err) {
    console.error("❌ Error fetching chats with messages:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching chats with messages",
    });
  }
};

module.exports = {
  searchApplicants,
  getChatList,
  createOrGetConversation,
  getChatMessages,
  getAllChatsWithMessages,
};
