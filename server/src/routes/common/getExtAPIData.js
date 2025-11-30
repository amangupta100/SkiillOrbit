const router = require("express").Router();
const {
  getPlaces,
  companiesName,
} = require("../../controllers/common/getExAPIData");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.get("/getLocation", getPlaces);
router.get("/getCompanyName", companiesName);

module.exports = router;
