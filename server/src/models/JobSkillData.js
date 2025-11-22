const mongoose = require("mongoose");

const JobSkillData = mongoose.model(
  "JobSkillData",
  new mongoose.Schema({}, { strict: false }),
  "JobSkillData"
);

module.exports = JobSkillData;
