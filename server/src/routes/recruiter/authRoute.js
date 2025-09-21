const {
  setProfilePendingCookie,
  recruiterLogin,
  logout,
  register,
} = require("../../controllers/recruiter/authController");
const router = require("express").Router();
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/profilePendingCookie", setProfilePendingCookie);
router.get("/check-auth", authMiddleware, (req, res) => {
  const recruiter = req.recruiter;
  res.status(200).json({
    success: true,
    recruiter,
    message: "Recruiter is authenticated",
  });
});

router.post("/register", register);

router.post("/login", recruiterLogin);
router.post("/logout", authMiddleware, logout);

module.exports = router;
