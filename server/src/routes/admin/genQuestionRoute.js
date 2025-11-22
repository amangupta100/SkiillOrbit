const router = require("express").Router();
const {
  generateQuestionsInstantly,
  scheduleQuestionGeneration,
  getQuestionsBySkill,
  getQuestionById,
} = require("../../controllers/admin/genQtnContr");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/genQtnInstantly", authMiddleware, generateQuestionsInstantly);
router.post("/scheduleGen", authMiddleware, scheduleQuestionGeneration);
router.get("/getallquestionbySkill", authMiddleware, getQuestionsBySkill);
router.get("/getQtnDetails/:id", authMiddleware, getQuestionById);

module.exports = router;
