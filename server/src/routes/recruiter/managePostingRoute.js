const router = require("express").Router();
const {
  createJobPosting,
  getallPosting,
  createInternPosting,
} = require("../../controllers/recruiter/ManagePostingContr");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/createJobPosting", authMiddleware, createJobPosting);
router.get("/getallPosting", authMiddleware, getallPosting);
router.post("/createInternPosting", authMiddleware, createInternPosting);

module.exports = router;
