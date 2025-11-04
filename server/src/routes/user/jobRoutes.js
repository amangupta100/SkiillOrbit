const authMiddleware = require("../../helpers/common/authMiddleware");
const {
  getallOpportunity,
  getSkillMatch,
  applyForOpportunity,
  getAllApplications,
} = require("../../controllers/user/jobController");

const router = require("express").Router();

router.get("/getallOpportunities", authMiddleware, getallOpportunity);
router.get("/matchSkills/:id", authMiddleware, getSkillMatch);
router.post("/apply/:id", authMiddleware, applyForOpportunity);
router.get("/AllappliedOpportunity", authMiddleware, getAllApplications);

module.exports = router;
