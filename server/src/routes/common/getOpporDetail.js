const {
  getOpportunityById,
} = require("../../controllers/common/getOpporDetail");
const authMiddleware = require("../../helpers/common/authMiddleware");

const router = require("express").Router();

router.get("/getOpportunityDetail/:id", authMiddleware, getOpportunityById);

module.exports = router;
