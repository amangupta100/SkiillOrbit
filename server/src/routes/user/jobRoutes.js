const authMiddleware = require("../../helpers/common/authMiddleware");
const {
  getallOpportunity,
  getSkillMatch,
  applyForOpportunity,
  getAllApplications,
  getApplicationDetails,
  saveOpportunity,
  searchOpportunities,
} = require("../../controllers/user/jobController");

const router = require("express").Router();

router.get("/getallOpportunities", authMiddleware, getallOpportunity);
router.get("/matchSkills/:id", authMiddleware, getSkillMatch);
router.post("/apply/:id", authMiddleware, applyForOpportunity);
router.get("/AllappliedOpportunity", authMiddleware, getAllApplications);
router.get("/getStAplDtl/:aplId", authMiddleware, getApplicationDetails);
router.post("/save", authMiddleware, saveOpportunity);
router.get("/search", authMiddleware, searchOpportunities);

module.exports = router;
