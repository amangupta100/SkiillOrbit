const { greetRecCont } = require("../../controllers/recruiter/sendMailContr");
const router = require("express").Router();

router.post("/greetRec", greetRecCont);

module.exports = router;
