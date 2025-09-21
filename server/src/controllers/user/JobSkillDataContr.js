const mongoose = require("mongoose");
const { connection } = mongoose; // Use your existing connection

const suggestDomains = async (req, res) => {
  try {
    const { q } = req.query;
    const domains = await connection.db
      .collection("JobSkillData")
      .aggregate([
        { $match: { domain: { $regex: q, $options: "i" } } },
        { $group: { _id: "$domain" } },
        { $project: { _id: 0, domain: "$_id" } },
        { $limit: 10 },
      ])
      .toArray();

    res.json(domains.map((d) => d.domain));
  } catch (error) {
    console.error("Domain suggestion error:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
};

const suggestRoles = async (req, res) => {
  try {
    let { domain, q } = req.query;

    // Ensure domain is always an array
    if (!Array.isArray(domain)) {
      domain = [domain];
    }

    const roles = await connection.db
      .collection("JobSkillData")
      .aggregate([
        { $match: { domain: { $in: domain } } }, // match multiple domains
        { $unwind: "$roles" },
        { $match: { "roles.title": { $regex: q, $options: "i" } } },
        {
          $project: {
            title: "$roles.title",
            skills: "$roles.skills",
          },
        },
        { $limit: 10 },
      ])
      .toArray();

    res.json(roles);
  } catch (error) {
    console.error("Role suggestion error:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

const suggestSkills = async (req, res) => {
  try {
    const { q } = req.query;

    const skills = await connection.db
      .collection("JobSkillData")
      .aggregate([
        { $unwind: "$roles" },
        { $unwind: "$roles.skills" },
        { $match: { "roles.skills": { $regex: q, $options: "i" } } },
        { $group: { _id: "$roles.skills" } },
        { $project: { _id: 0, skill: "$_id" } },
        { $limit: 10 },
      ])
      .toArray();

    res.json(skills.map((s) => s.skill));
  } catch (error) {
    console.error("Skill suggestion error:", error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};

module.exports = { suggestDomains, suggestRoles, suggestSkills };
