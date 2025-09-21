const authMiddleware = require("../../helpers/common/authMiddleware");
const {
  getallOpportunity,
  getSkillMatch,
} = require("../../controllers/user/jobController");

const router = require("express").Router();

router.get("/getallOpportunities", authMiddleware, getallOpportunity);
router.get("/matchSkills/:id", authMiddleware, getSkillMatch);

module.exports = router;
