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

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ⚡ Load ONLY the fields required — exclude heavy arrays like messages[]
    const chats = await Chat.find(
      { "members.userId": userId },
      {
        messages: 0, // ❌ Don't load messages array at all (super heavy)
        description: 0,
        isArchived: 0,
        isMuted: 0,
        "members.lastReadMessageId": 0,
        __v: 0,
      }
    )
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

    // ⚡ Format output EXACTLY like your original structure
    const chatList = chats.map((chat) => {
      const isPrivate = chat.type === "private";

      const otherMembers = chat.members.filter(
        (m) => m.userId && m.userId._id.toString() !== userId.toString()
      );

      const receiver = isPrivate ? otherMembers[0] : null;

      return {
        _id: chat._id,
        type: chat.type,

        // same name logic
        name:
          isPrivate && receiver
            ? receiver.userId?.name || "Unknown User"
            : chat.name || "Group Chat",

        userId: isPrivate && receiver ? receiver.userId?._id : null,

        // same avatar logic
        avatar: isPrivate
          ? receiver?.userId?.image || null
          : chat.avatar || null,

        // same lastMessage logic
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

        // timestamps + status
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

    // ⚡ Load ONLY messages from chat — do NOT populate entire chat object
    const chat = await Chat.findById(chatId, {
      messages: 1,
      _id: 1,
    }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // ⚡ Collect all sender + receiver user IDs to fetch in ONE query
    const senderIds = chat.messages.map((m) => m.senderId);
    const receiverIds = chat.messages.map((m) => m.receiverId).filter(Boolean);

    const uniqueUserIds = [...new Set([...senderIds, ...receiverIds])];

    // ⚡ Fetch ALL user data in 1 DB query (fast)
    const users = await User.find(
      { _id: { $in: uniqueUserIds } },
      "name image email onlineStatus lastActiveDisplay"
    ).lean();

    // Make map for O(1) lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // ⚡ Sort + enhance messages (same response format)
    const sortedMessages = chat.messages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((msg) => {
        const sender = userMap.get(msg.senderId?.toString());
        const receiver = userMap.get(msg.receiverId?.toString());

        return {
          ...msg,
          senderId: sender
            ? { _id: sender._id, name: sender.name, image: sender.image }
            : null,
          receiverId: receiver
            ? {
                _id: receiver._id,
                name: receiver.name,
                image: receiver.image,
                email: receiver.email,
                onlineStatus: receiver.onlineStatus,
                lastActiveDisplay: receiver.lastActiveDisplay,
              }
            : null,
          isSentByUser: msg.senderId?.toString() === currentUserId.toString(),
          currentStatus: msg.status,
        };
      });

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
      return res.status(400).json({
        success: false,
        message: "Missing sender or receiver ID",
      });
    }

    // 1️⃣ Check if chat already exists (FAST + indexed)
    let chat = await Chat.findOne(
      {
        type: "private",
        "members.userId": { $all: [senderId, receiverId] },
      },
      {
        messages: 0, // 🚀 do NOT load huge messages array
      }
    ).lean();

    // 2️⃣ Create new chat if not exists
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

      chat = chat.toObject();
    }

    let newMessage = null;

    // 3️⃣ Add message if provided
    if (content || (media && media.length > 0)) {
      const now = new Date();

      newMessage = {
        senderId,
        senderModel,
        receiverId,
        receiverModel,
        content,
        media,
        status: "sent",
        createdAt: now,
      };

      // Only modify chat minimally after insert
      await Chat.updateOne(
        { _id: chat._id },
        {
          $push: { messages: newMessage },
          $set: {
            lastMessage: {
              senderId,
              senderModel,
              content,
              media,
              status: "sent",
              createdAt: now,
            },
            updatedAt: now,
          },
        }
      );

      // Append lastMessage to chat object for frontend
      chat.lastMessage = {
        senderId,
        senderModel,
        content,
        media,
        status: "sent",
        createdAt: now,
      };
    }

    // 4️⃣ Fetch member details WITHOUT HEAVY POPULATE
    const memberIds = chat.members.map((m) => m.userId);
    const users = await User.find(
      { _id: { $in: memberIds } },
      "name image onlineStatus lastActiveDisplay"
    ).lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Build populated-style members (same shape as old response)
    const populatedMembers = chat.members.map((m) => ({
      ...m,
      userId: userMap.get(m.userId.toString()) || null,
    }));

    // Build final chat object identically to old response
    const responseChat = {
      ...chat,
      members: populatedMembers,
    };

    return res.status(200).json({
      success: true,
      message: "Conversation created or updated successfully",
      chatId: chat._id,
      chat: responseChat,
      lastMessage: chat?.lastMessage || newMessage,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while creating chat",
    });
  }
};

const getAllChatsWithMessages = async (req, res) => {
  try {
    const { id: userId } = req.recruiter || req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1️⃣ Load only required fields (NO message populate!)
    const chats = await Chat.find(
      {
        type: "private",
        "members.userId": userId,
        "messages.receiverId": userId, // only chats where user RECEIVED messages
      },
      {
        messages: 1,
        members: 1,
        lastMessage: 1,
        avatar: 1,
        name: 1,
        updatedAt: 1,
      }
    )
      .sort({ updatedAt: -1 })
      .lean();

    if (!chats || chats.length === 0) {
      return res.json({
        success: true,
        totalChats: 0,
        chats: [],
      });
    }

    // 2️⃣ Collect all userIds referenced from messages + members
    const senderIds = [];
    const receiverIds = [];
    const memberIds = [];

    for (const chat of chats) {
      for (const msg of chat.messages) {
        if (msg.senderId) senderIds.push(msg.senderId.toString());
        if (msg.receiverId) receiverIds.push(msg.receiverId.toString());
      }
      for (const m of chat.members) {
        memberIds.push(m.userId.toString());
      }
    }

    const uniqueUserIds = [
      ...new Set([...senderIds, ...receiverIds, ...memberIds]),
    ];

    // 3️⃣ Fetch all related users in ONE FAST QUERY
    const users = await User.find(
      { _id: { $in: uniqueUserIds } },
      "name email image onlineStatus lastActiveDisplay"
    ).lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 4️⃣ Build final chat list
    const chatList = chats
      .map((chat) => {
        // Find the other user (not the currentUser)
        const otherMember = chat.members.find(
          (m) => m.userId.toString() !== userId.toString()
        );

        const otherUser = userMap.get(otherMember?.userId?.toString());

        // 5️⃣ Filter messages where receiver = userId
        const receivedMessages = chat.messages
          .filter((msg) => msg.receiverId?.toString() === userId.toString())
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map((msg) => {
            const sender = userMap.get(msg.senderId?.toString());
            const receiver = userMap.get(msg.receiverId?.toString());

            return {
              _id: msg._id,
              senderId: sender
                ? {
                    _id: sender._id,
                    name: sender.name,
                    image: sender.image,
                  }
                : null,
              receiverId: receiver
                ? {
                    _id: receiver._id,
                    name: receiver.name,
                    email: receiver.email,
                    image: receiver.image,
                    onlineStatus: receiver.onlineStatus,
                    lastActiveDisplay: receiver.lastActiveDisplay,
                  }
                : null,
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
            };
          });

        if (receivedMessages.length === 0) return null;

        return {
          chatId: chat._id,
          name: otherUser?.name || chat.name || "Unknown User",
          avatar: otherUser?.image || chat.avatar || null,
          email: otherUser?.email || null,
          onlineStatus: otherUser?.onlineStatus || "offline",
          lastActiveDisplay: otherUser?.lastActiveDisplay || null,
          updatedAt: chat.updatedAt,
          lastMessage: chat.lastMessage || null,
          messages: receivedMessages,
          user: otherUser || null,
        };
      })
      .filter(Boolean);

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

    // 1️⃣ Validate required fields
    if (!senderId || !receiverId || !senderModel || !receiverModel) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: senderId, senderModel, receiverId, receiverModel",
      });
    }

    // 2️⃣ Validate models
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

    // Normalize IDs to ObjectId for faster matching
    const sId = new ObjectId(senderId);
    const rId = new ObjectId(receiverId);

    // 3️⃣ Check if chat exists (FAST & Indexed)
    const existingChat = await Chat.findOne(
      {
        type: "private",
        "members.userId": { $all: [sId, rId] },
      },
      { _id: 1 } // projection for speed
    ).lean();

    if (existingChat) {
      return res.json({
        success: true,
        chatId: existingChat._id.toString(),
        exists: true,
      });
    }

    // 4️⃣ Create new chat (FAST using Chat.create)
    const now = new Date();
    const newChat = await Chat.create({
      type: "private",
      name: null,
      description: null,
      avatar: null,
      members: [
        {
          userId: sId,
          userModel: senderModel,
          role: "member",
          joinedAt: now,
        },
        {
          userId: rId,
          userModel: receiverModel,
          role: "member",
          joinedAt: now,
        },
      ],
      lastMessage: null,
      createdBy: sId,
      createdByModel: senderModel,
      isArchived: false,
      isMuted: false,
    });

    return res.status(201).json({
      success: true,
      chatId: newChat._id.toString(),
      exists: false,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const scheduleInterview = async (req, res) => {
  try {
    const {
      applicantId,
      postingId,
      interviewDate,
      notes = "",
      postingType,
    } = req.body;

    const recruiterId = req.recruiter?.id;
    if (!recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1️⃣ Basic validation
    if (!applicantId || !postingId || !interviewDate || !postingType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: applicantId, postingId, interviewDate, postingType",
      });
    }

    const normalizedType = postingType.toLowerCase();
    const now = new Date();

    // 2️⃣ Fetch posting (NO populate → only necessary fields)
    let posting = null;

    if (normalizedType === "job") {
      posting = await Job.findById(postingId, "role company").lean();
    } else if (normalizedType === "internship") {
      posting = await Internship.findById(postingId, "role company").lean();
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

    // Fetch company name in one fast query
    let companyName = "Company";
    if (posting.company) {
      const company = await Company.findById(posting.company, "name").lean();
      companyName = company?.name || "Company";
    }

    const role = posting.role || "Role";
    const parsedInterviewDate = new Date(interviewDate);

    // 3️⃣ Create unique interview entry (FAST using .create)
    const uniqueCode = generateInterviewCode();

    const interview = await InterviewSchema.create({
      recruiterId,
      applicantId,
      postingId,
      postingType: normalizedType,
      interviewDate: parsedInterviewDate,
      notes,
      status: "SCHEDULED",
      reminderJobScheduled: false,
      reminderSent: false,
      uniqueCode,
      createdAt: now,
      updatedAt: now,
    });

    // 4️⃣ Schedule reminder job
    const reminderResult = await scheduleReminderJob(interview);

    // 5️⃣ Fetch applicant + recruiter in same batch (faster)
    const [applicant, recruiter] = await Promise.all([
      User.findById(applicantId, "name email").lean(),
      Recruiter.findById(recruiterId, "name email").lean(),
    ]);

    if (!applicant || !recruiter) {
      await InterviewSchema.findByIdAndDelete(interview._id);
      return res.status(404).json({
        success: false,
        message: "Applicant or recruiter not found",
      });
    }

    const formattedDate = format(parsedInterviewDate, "PPP p");

    // 6️⃣ Send email notification
    await sendInterviewScheduledEmail(
      applicant.email,
      applicant.name,
      recruiter.name,
      companyName,
      role,
      parsedInterviewDate,
      notes,
      uniqueCode
    );

    // 7️⃣ Push notifications (FAST using atomic update)
    const applicantNotification = {
      type: "INTERVIEW_SCHEDULED",
      title: "Interview Scheduled",
      message: `Your interview for ${role} at ${companyName} is scheduled for ${formattedDate}.`,
      meta: {
        interviewId: interview._id,
        postingId,
        interviewDate,
        uniqueCode,
      },
      read: false,
      createdAt: now,
    };

    const recruiterNotification = {
      type: "INTERVIEW_SCHEDULED",
      title: "Interview Scheduled",
      message: `Interview with ${applicant.name} for ${role} is scheduled for ${formattedDate}.`,
      meta: {
        interviewId: interview._id,
        applicantId,
        interviewDate,
        uniqueCode,
      },
      read: false,
      createdAt: now,
    };

    await Promise.all([
      User.updateOne(
        { _id: applicantId },
        { $push: { notifications: applicantNotification } }
      ),
      Recruiter.updateOne(
        { _id: recruiterId },
        { $push: { notifications: recruiterNotification } }
      ),
    ]);

    // 8️⃣ Return SAME response format as before
    return res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      data: {
        interviewId: interview._id,
        interviewDate: formattedDate,
        uniqueCode,
        reminderJobId: reminderResult.jobId || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
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
