const RecruiterModel = require("../../models/RecruiterModel");

const getProfileDet = async (req, res) => {
  try {
    const { id } = req.recruiter;
    if (!id) {
      return res.json({
        success: false,
        message: "Unauthorized to perform the action",
      });
    }

    const recr = await RecruiterModel.findById(id)
      .select("-password -loginHistory -sessionToken") // exclude sensitive fields
      .populate("companyId"); // fetch only needed company details

    if (!recr) {
      return res.json({ success: false, message: "Account not found" });
    }

    res.json({ success: true, data: recr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProfileDet };
