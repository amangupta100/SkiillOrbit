const router = require("express").Router();
const {
  createJobPosting,
  getallPosting,
  createInternPosting,
  deletePosting,
  getApplicantsByOpportunity,
  sendDet_upDateStatus,
} = require("../../controllers/recruiter/ManagePostingContr");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/createJobPosting", authMiddleware, createJobPosting);
router.get("/getallPosting", authMiddleware, getallPosting);
router.post("/createInternPosting", authMiddleware, createInternPosting);
router.delete("/managePosting/:id", authMiddleware, deletePosting);
router.get("/getallApplicants/:id", authMiddleware, getApplicantsByOpportunity);
router.post(
  "/sendAplDet&updateStatus/:opporId/:applicantId",
  authMiddleware,
  sendDet_upDateStatus
);

module.exports = router;
