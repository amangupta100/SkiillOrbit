const {
  greetUserCont,
  sendResultEmail,
} = require("../../controllers/user/sendMailContr");
const router = require("express").Router();

router.post("/greetUser", greetUserCont);
router.post("/TestResult", sendResultEmail);

module.exports = router;
