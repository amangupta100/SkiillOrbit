const { processAppl } = require("../../controllers/recruiter/atsController");
const authMiddleware = require("../../helpers/common/authMiddleware");
const router = require("express").Router();

router.post("/getResumes/:id", authMiddleware, processAppl);

module.exports = router;
