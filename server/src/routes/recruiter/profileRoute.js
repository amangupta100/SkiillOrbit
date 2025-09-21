const {
  getProfileDet,
} = require("../../controllers/recruiter/profileController");
const authMiddleware = require("../../helpers/common/authMiddleware");
const router = require("express").Router();

router.get("/getProfileDet", authMiddleware, getProfileDet);

module.exports = router;
