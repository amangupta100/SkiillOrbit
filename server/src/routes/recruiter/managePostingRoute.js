const router = require("express").Router();
const {
  createJobPosting,
  getallPosting,
  createInternPosting,
  deletePosting,
} = require("../../controllers/recruiter/ManagePostingContr");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/createJobPosting", authMiddleware, createJobPosting);
router.get("/getallPosting", authMiddleware, getallPosting);
router.post("/createInternPosting", authMiddleware, createInternPosting);
router.delete("/managePosting/:id", authMiddleware, deletePosting);

module.exports = router;
