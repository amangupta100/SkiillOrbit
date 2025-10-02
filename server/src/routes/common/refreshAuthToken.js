const { refreshToken } = require("../../helpers/common/refreshToken");
const router = require("express").Router();

router.get("/refreshToken", refreshToken);

module.exports = router;
