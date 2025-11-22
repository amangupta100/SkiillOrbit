const Chat = require("../../models/Chat");
// controllers/searchApplicantsController.js
const Application = require("../../models/ApplicationModel");
const Job = require("../../models/JobModel");
const Internship = require("../../models/InternshipModel");
const User = require("../../models/UserModel"); // assuming you have a User model
const InterviewSchema = require("../../models/InterviewSchema");
const Recruiter = require("../../models/RecruiterModel");
const {
  sendInterviewScheduledEmail,
  scheduleReminderJob,
} = require("../recruiter/sendMailContr");
const { format } = require("date-fns");

function generateInterviewCode() {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

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
    return res.status(500).json({
      success: false,
      message: "Server error while fetching chats with messages",
    });
  }
};

const GetPrivateChat = async (req, res) => {
  try {
    const { senderId, senderModel, receiverId, receiverModel } = req.body;

    // Validation
    if (!senderId || !receiverId || !senderModel || !receiverModel) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: senderId, senderModel, receiverId, receiverModel",
      });
    }

    // Ensure models are valid (based on schema enum)
    const validModels = ["User", "Recruiter"];
    if (
      !validModels.includes(senderModel) ||
      !validModels.includes(receiverModel)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid senderModel or receiverModel. Must be "User" or "Recruiter".',
      });
    }

    // Find existing private chat between these two users
    const existingChat = await Chat.findOne({
      type: "private",
      members: {
        $all: [
          { userId: senderId, userModel: senderModel },
          { userId: receiverId, userModel: receiverModel },
        ],
      },
    }).select("_id"); // Only select ID for efficiency

    if (existingChat) {
      return res.json({
        success: true,
        chatId: existingChat._id.toString(),
        exists: true,
      });
    }

    // Create new private chat
    const newChat = new Chat({
      type: "private",
      name: null, // Private chats typically don't have a name; can be set dynamically if needed
      description: null,
      avatar: null,
      members: [
        {
          userId: senderId,
          userModel: senderModel,
          role: "member",
          joinedAt: new Date(),
        },
        {
          userId: receiverId,
          userModel: receiverModel,
          role: "member",
          joinedAt: new Date(),
        },
      ],
      lastMessage: null, // No messages yet
      createdBy: senderId,
      createdByModel: senderModel,
      isArchived: false,
      isMuted: false,
    });

    await newChat.save();

    // Optionally, populate or add more details if needed (e.g., receiver name for display)
    // But for now, just return the ID

    res.status(201).json({
      success: true,
      chatId: newChat._id.toString(),
      exists: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

// Schedule Interview Controller
const scheduleInterview = async (req, res) => {
  try {
    const {
      applicantId,
      postingId,
      interviewDate,
      notes = "",
      postingType,
    } = req.body; // 🚨 Explicitly destructure postingType
    const recruiterId = req.recruiter.id;

    // Validation
    if (!applicantId || !postingId || !interviewDate || !postingType) {
      // 🚨 Require postingType
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: applicantId, postingId, interviewDate, postingType (job/internship)",
      });
    }

    // 🚨 NEW: Determine & validate posting type (override if mismatched)
    let actualPostingType = postingType.toLowerCase();
    let posting = null;
    if (actualPostingType === "job") {
      posting = await JobModel.findById(postingId)
        .populate("company", "name")
        .lean();
    } else if (actualPostingType === "internship") {
      posting = await Internship.findById(postingId)
        .populate("company", "name")
        .lean();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid postingType: must be 'job' or 'internship'",
      });
    }

    if (!posting) {
      return res.status(404).json({
        success: false,
        message: "Posting not found—cannot schedule interview",
      });
    }

    // Generate unique interview code
    const uniqueCode = generateInterviewCode();

    // Create new interview (use validated type)
    const newInterview = new InterviewSchema({
      // 🚨 Schema now validates these
      recruiterId,
      applicantId,
      postingId,
      postingType: actualPostingType, // Normalized
      interviewDate: new Date(interviewDate),
      notes,
      status: "SCHEDULED",
      reminderJobScheduled: false, // Set after scheduling
      reminderSent: false,
      uniqueCode,
    });

    await newInterview.save();

    // Schedule reminder job (unchanged)
    const reminderResult = await scheduleReminderJob(newInterview);
    if (!reminderResult.success) {
    }

    // Use validated posting data (no re-fetch needed)
    const role = posting.role || "Role"; // Both schemas have 'role'
    const companyName = posting.company ? posting.company.name : "Company";

    const formattedDate = format(new Date(interviewDate), "PPP p");

    // Fetch applicant/recruiter (unchanged)
    const applicant = await User.findById(applicantId).select("name email");
    const recruiter = await Recruiter.findById(recruiterId).select(
      "name email"
    );

    if (!applicant || !recruiter) {
      await InterviewSchema.findByIdAndDelete(newInterview._id); // Cleanup
      return res
        .status(404)
        .json({ success: false, message: "Applicant or recruiter not found" });
    }

    // Send scheduled email (unchanged, but uses validated role/companyName)
    const emailResult = await sendInterviewScheduledEmail(
      applicant.email,
      applicant.name,
      recruiter.name,
      companyName,
      role,
      interviewDate,
      notes,
      uniqueCode
    );

    // Notifications (unchanged)
    await User.findByIdAndUpdate(applicantId, {
      $push: {
        notifications: {
          type: "INTERVIEW_SCHEDULED",
          title: "Interview Scheduled",
          message: `Your interview for ${role} at ${companyName} is scheduled for ${formattedDate}.`,
          meta: {
            interviewId: newInterview._id,
            postingId,
            interviewDate,
            uniqueCode,
          },
          read: false,
        },
      },
    });

    await Recruiter.findByIdAndUpdate(recruiterId, {
      $push: {
        notifications: {
          type: "INTERVIEW_SCHEDULED",
          title: "Interview Scheduled",
          message: `Interview with ${applicant.name} for ${role} is scheduled for ${formattedDate}.`,
          meta: {
            interviewId: newInterview._id,
            applicantId,
            interviewDate,
            uniqueCode,
          },
          read: false,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      data: {
        interviewId: newInterview._id,
        interviewDate: formattedDate,
        uniqueCode,
        reminderJobId: reminderResult.jobId || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

module.exports = {
  searchApplicants,
  getChatList,
  createOrGetConversation,
  getChatMessages,
  getAllChatsWithMessages,
  GetPrivateChat,
  scheduleInterview,
};
