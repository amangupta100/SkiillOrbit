const authMiddleware = require("../../helpers/common/authMiddleware");
const router = require("express").Router();

router.get("/", authMiddleware, (req, res) => {
  const user = req.user || req.recruiter;
  res.status(200).json({
    success: true,
    user,
    message: "User is authenticated",
  });
});

module.exports = router;
