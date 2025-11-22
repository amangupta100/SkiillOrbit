// controllers/notificationController.js

const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");
const InterviewSchema = require("../../models/InterviewSchema");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const recruiterId = req.recruiter?.id || null;

    let account = null;

    if (userId) {
      account = await User.findById(userId).select("notifications name");
    } else if (recruiterId) {
      account = await Recruiter.findById(recruiterId).select(
        "notifications name"
      );
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found",
      });
    }

    return res.status(200).json({
      success: true,
      count: account.notifications.length,
      notifications: account.notifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
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
    const userId = req.user?.id || null;
    const recruiterId = req.recruiter?.id || null;

    let account = null;

    if (userId) {
      account = await User.findByIdAndUpdate(
        userId,
        { $set: { notifications: [] } },
        { new: true }
      );
    } else if (recruiterId) {
      account = await Recruiter.findByIdAndUpdate(
        recruiterId,
        { $set: { notifications: [] } },
        { new: true }
      );
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
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
    const userId = req.user?.id || null;
    const recruiterId = req.recruiter?.id || null;

    let account = null;

    if (userId) {
      account = await User.findById(userId);
    } else if (recruiterId) {
      account = await Recruiter.findById(recruiterId);
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found",
      });
    }

    if (!account.notifications?.length) {
      return res.status(200).json({
        success: true,
        message: "No notifications to mark",
      });
    }

    // 🔥 Mark all unread notifications as read
    account.notifications = account.notifications.map((n) => ({
      ...n,
      read: true,
    }));

    await account.save();

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
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

    // Determine the query based on requester
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
      .populate("recruiterId", "name email")
      .populate("applicantId", "name email")
      .sort({ interviewDate: -1 }) // newest first
      .lean();

    return res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
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
