const SupportContact = require("../../models/SupportContact");

const createQuery = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const ticket = await SupportContact.create({
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Support request submitted successfully",
      data: ticket,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit support request",
      error: err.message,
    });
  }
};

// ------------------
// GET ALL SUPPORT QUERIES
// ------------------
const getAllSupportQueries = async (req, res) => {
  try {
    let { page = 1, limit = 20 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    // Fetch queries sorted by newest first
    const queries = await SupportContact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SupportContact.countDocuments();

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: queries,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch support queries",
      error: err.message,
    });
  }
};

module.exports = { createQuery, getAllSupportQueries };
