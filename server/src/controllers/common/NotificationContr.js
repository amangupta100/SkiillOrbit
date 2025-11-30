// controllers/notificationController.js

const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");
const InterviewSchema = require("../../models/InterviewSchema");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const recruiterId = req.recruiter?.id;

    let notifications = [];

    if (userId) {
      const user = await User.findById(
        userId,
        { notifications: 1 } // only fetch notifications
      ).lean();
      notifications = user?.notifications || [];
    } else if (recruiterId) {
      const recruiter = await Recruiter.findById(
        recruiterId,
        { notifications: 1 } // only fetch notifications
      ).lean();
      notifications = recruiter?.notifications || [];
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found",
      });
    }

    // Sort newest first
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: sorted.length,
      notifications: sorted, // SAME RESPONSE FORMAT
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

const clearNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const recruiterId = req.recruiter?.id;

    if (userId) {
      await User.updateOne({ _id: userId }, { $set: { notifications: [] } });
    } else if (recruiterId) {
      await Recruiter.updateOne(
        { _id: recruiterId },
        { $set: { notifications: [] } }
      );
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All notifications cleared", // SAME RESPONSE FORMAT
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while clearing notifications",
    });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const recruiterId = req.recruiter?.id;

    let Model = null;
    let id = null;

    if (userId) {
      Model = User;
      id = userId;
    } else if (recruiterId) {
      Model = Recruiter;
      id = recruiterId;
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found",
      });
    }

    // Fetch notifications only (fast)
    const account = await Model.findById(id, { notifications: 1 }).lean();

    if (!account.notifications?.length) {
      return res.status(200).json({
        success: true,
        message: "No notifications to mark",
      });
    }

    // Mark all notifications as read
    const updated = account.notifications.map((n) => ({
      ...n,
      read: true,
    }));

    await Model.updateOne({ _id: id }, { $set: { notifications: updated } });

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read", // SAME RESPONSE FORMAT
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while marking notifications as read",
    });
  }
};

const getAllInterviews = async (req, res) => {
  try {
    const recruiter = req.recruiter;
    const user = req.user;

    let query = {};

    if (recruiter && recruiter.id) {
      query.recruiterId = recruiter.id;
    } else if (user && user.id) {
      query.applicantId = user.id;
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found.",
      });
    }

    const interviews = await InterviewSchema.find(query)
      .populate("recruiterId", "name email") // light populate
      .populate("applicantId", "name email")
      .sort({ interviewDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: interviews.length,
      interviews, // EXACT SAME RESPONSE STRUCTURE
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching interviews.",
    });
  }
};

module.exports = {
  getNotifications,
  clearNotifications,
  markNotificationsAsRead,
  getAllInterviews,
};
