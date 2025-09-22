const router = require("express").Router();
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/refreshAuthToken", authMiddleware, (req, res) => {
  return res
    .status(200)
    .json({
      success: true,
      message: "Tokens refresh successfully",
      res: req.user || req.recruiter,
    });
});

module.exports = router;
