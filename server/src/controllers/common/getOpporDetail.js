// controllers/opportunityController.js
const Job = require("../../models/JobModel");
const Internship = require("../../models/InternshipModel");
const User = require("../../models/UserModel");

const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // logged-in user ID

    // ⭐ Fetch user saved list once (if logged in)
    let userSaved = [];
    if (userId) {
      const user = await User.findById(userId, "savedOpportunities").lean();
      userSaved = user?.savedOpportunities || [];
    }

    // Helper → check if opportunity saved
    const isSaved = userSaved.some(
      (item) => String(item.itemId) === String(id)
    );

    // ⚡ 1️⃣ Try Job first
    let job = await Job.findById(id)
      .lean()
      .populate("company", "name imagePath industry")
      .populate("createdBy", "name email")
      .populate("applications", "user status score");

    if (job) {
      return res.status(200).json({
        success: true,
        data: {
          ...job,
          type: "Job",
          saved: isSaved, // 👈 Added here
        },
      });
    }

    // ⚡ 2️⃣ Try Internship
    let internship = await Internship.findById(id)
      .lean()
      .populate("company", "name imagePath industry")
      .populate("createdBy", "name email")
      .populate("applications", "user status score");

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...internship,
        type: "Internship",
        saved: isSaved, // 👈 Added here
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getOpportunityById };
