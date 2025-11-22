const {
  processAppl,
  saveAtsScores,
} = require("../../controllers/recruiter/atsController");
const authMiddleware = require("../../helpers/common/authMiddleware");
const router = require("express").Router();

router.post("/getResumes/:id", authMiddleware, processAppl);
router.post("/saveScores/:id", authMiddleware, saveAtsScores);

module.exports = router;
