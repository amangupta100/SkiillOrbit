const JobSkillData = require("../../models/JobSkillData");

const getAllDomains = async (req, res) => {
  try {
    const data = await JobSkillData.find({})
      .select("domain roles")
      .select("-skills");

    return res.status(200).json({
      success: true,
      data, // <-- send whole domain + roles array
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch domains",
    });
  }
};

const getRoles = async (req, res) => {
  try {
    const domain = req.query.domain;
    if (domain) {
      const data = await JobSkillData.findOne({ domain }).select(
        "domain roles"
      );
      return res.status(200).json({ success: true, data });
    }

    const data = await JobSkillData.find({}).select("domain roles");
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch domains",
    });
  }
};

const getRoleSkills = async (req, res) => {
  try {
    const { domain, role } = req.query;

    if (!domain || !role) {
      return res.status(400).json({
        success: false,
        message: "Domain and role are required",
      });
    }

    // Find the domain
    const data = await JobSkillData.findOne({ domain }).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Find the specific role
    const foundRole = data.roles.find((r) => r.title === role);

    if (!foundRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        domain,
        role: foundRole.title,
        skills: foundRole.skills,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch skills",
    });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const { domain, role, skill } = req.query;

    const updated = await JobSkillData.findOneAndUpdate(
      { domain, "roles.title": role },
      { $pull: { "roles.$.skills": skill } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Skill removed",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove skill",
      error: err.message,
    });
  }
};

const addSkill = async (req, res) => {
  try {
    const { domain, role, skill } = req.body;

    const updated = await JobSkillData.findOneAndUpdate(
      { domain, "roles.title": role },
      { $addToSet: { "roles.$.skills": skill } }, // prevents duplicates
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Skill added",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to add skill",
      error: err.message,
    });
  }
};

module.exports = {
  getAllDomains,
  getRoles,
  getRoleSkills,
  deleteSkill,
  addSkill,
};
