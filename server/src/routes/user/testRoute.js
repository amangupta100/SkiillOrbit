const router = require("express").Router();
const {
  getAllTestScores,
  getSkillsByUserDesiredRole,
  genQuestionContr,
  genTest,
  testSubmit,
} = require("../../controllers/user/testController");
const { genTestToken } = require("../../helpers/test/genTestDetailsToken");
const authMiddleware = require("../../helpers/common/authMiddleware");
const { testDetMidd } = require("../../helpers/test/testDetMidd");

router.get("/getallTest-Scores", authMiddleware, getAllTestScores);
router.get("/getallSkillsbyRole", authMiddleware, getSkillsByUserDesiredRole);
router.get("/genTestDetToken", authMiddleware, genTestToken);
router.get("/gettestDet", authMiddleware, testDetMidd, (req, res) => {
  res.json({ success: true, data: req.testDet });
});

router.post("/genTest", authMiddleware, testDetMidd, genTest);
router.get("/submitTest", authMiddleware, testSubmit);

module.exports = router;
